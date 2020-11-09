/**
 * race-candidates/house-by-district.js
 *
 * @description :: Find incumbents by open source id.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find house candidates by district',

  description: 'Find house candidates by district',

  inputs: {
    state: {
      type: 'string',
      required: true,
    },
    district: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Candidate Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Candidate Not Found.',
      responseType: 'notFound',
    },
    badRequest: {
      description: 'Bad Request.',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { state, district } = inputs;
      const lowerState = state.toLowerCase();

      const houseIncumbents = await Incumbent.find({
        state: lowerState,
        district,
        chamber: 'House',
        isActive: true,
        isHidden: false,
      }).sort('raised DESC');

      const houseCandidates = await RaceCandidate.find({
        state: lowerState,
        district,
        chamber: 'House',
        isActive: true,
        isHidden: false,
      }).sort('raised DESC');

      houseCandidates.forEach(candidate => {
        candidate.combinedRaised = candidate.raised;
      });

      houseIncumbents.forEach(incumbent => {
        incumbent.isIncumbent = true;
        incumbent.combinedRaised = incumbent.raised + incumbent.pacRaised;
      });

      const candidates = [...houseIncumbents, ...houseCandidates];
      const sortedCandidates = await sails.helpers.goodNotGoodSplitHelper(
        candidates,
        'house',
      );
      let topRank = 0;
      for (let i = 0; i < sortedCandidates.candidates.good.length; i++) {
        let candidate = sortedCandidates.candidates.good[i];
        const votesNeeded = await sails.helpers.votesNeeded(candidate);
        candidate.votesNeeded = votesNeeded;
        const ranking = await Ranking.count({
          candidate: candidate.id,
          chamber: 'house',
          isIncumbent: candidate.isIncumbent,
        });
        candidate.ranking = ranking;
        const { likelyVoters } = candidate;
        if (ranking + likelyVoters > topRank) {
          topRank = ranking + likelyVoters;
        }
      }

      for (let i = 0; i < sortedCandidates.candidates.unknown.length; i++) {
        let candidate = sortedCandidates.candidates.unknown[i];
        const votesNeeded = await sails.helpers.votesNeeded(candidate);
        candidate.votesNeeded = votesNeeded;
        const ranking = await Ranking.count({
          candidate: candidate.id,
          chamber: 'house',
          isIncumbent: candidate.isIncumbent,
        });
        candidate.ranking = ranking;
        const { likelyVoters } = candidate;
        if (ranking + likelyVoters > topRank) {
          topRank = ranking + likelyVoters;
        }
      }

      // if good is empty, check for empty bloc ranking
      if (sortedCandidates.candidates.good.length === 0) {
        const ranking = await Ranking.count({
          candidate: parseInt(district, 10) * -1,
          chamber: 'house',
          isIncumbent: false,
        });

        if (ranking > topRank) {
          topRank = ranking;
        }
      }

      let goodEmptyBloc;
      if (sortedCandidates.candidates.good.length === 0) {
        const emptyBlockId = parseInt(district, 10) * -1;
        goodEmptyBloc = await Ranking.count({
          candidate: emptyBlockId,
          userState: lowerState,
          chamber: 'house',
          isIncumbent: false,
        });
      }

      return exits.success({
        houseCandidates: {
          ...sortedCandidates.candidates,
          topRank,
          goodEmptyBloc,
        },
      });
    } catch (e) {
      console.log('Error in find house cand', e);
      await sails.helpers.errorLoggerHelper(
        'Error at race-candidates/house-by-district',
        e,
      );
      return exits.notFound();
    }
  },
};
