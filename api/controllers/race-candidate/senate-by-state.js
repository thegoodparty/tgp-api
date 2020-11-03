/**
 * incumbents/find-by-id.js
 *
 * @description :: Find incumbents by open source id.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find Incumbent by id',

  description: 'Find incumbents by open source id',

  inputs: {
    state: {
      type: 'string',
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
      const { state } = inputs;
      const lowerState = state.toLowerCase();

      const senateCandidates = await RaceCandidate.find({
        state: lowerState,
        chamber: 'Senate',
        isActive: true,
        isHidden: false,
      }).sort('raised DESC');

      const senateIncumbents = await Incumbent.find({
        state: lowerState,
        chamber: 'Senate',
        isActive: true,
        isHidden: false,
      }).sort('raised DESC');

      senateCandidates.forEach(candidate => {
        candidate.combinedRaised = candidate.raised;
      });

      senateIncumbents.forEach(incumbent => {
        incumbent.isIncumbent = true;
        incumbent.combinedRaised = incumbent.raised + incumbent.pacRaised;
      });

      const candidates = [...senateIncumbents, ...senateCandidates];
      const sortedCandidates = await sails.helpers.goodNotGoodSplitHelper(
        candidates,
        'senate',
      );

      let topRank = 0;
      for (let i = 0; i < sortedCandidates.candidates.good.length; i++) {
        let candidate = sortedCandidates.candidates.good[i];
        const votesNeeded = await sails.helpers.votesNeeded(candidate);
        candidate.votesNeeded = votesNeeded;
        const ranking = await Ranking.count({
          candidate: candidate.id,
          chamber: 'senate',
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
          chamber: 'senate',
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
          candidate: -1,
          chamber: 'senate',
          isIncumbent: false,
        });
        if (ranking > topRank) {
          topRank = ranking;
        }
      }

      let goodEmptyBloc;
      if (sortedCandidates.candidates.good.length === 0) {
        goodEmptyBloc = await Ranking.count({
          candidate: -1,
          userState: lowerState,
          chamber: 'senate',
          isIncumbent: false,
        });
      }

      return exits.success({
        senateCandidates: {
          ...sortedCandidates.candidates,
          topRank,
          goodEmptyBloc,
        },
      });
    } catch (e) {
      console.log('Error in find senate by id', e);
      await sails.helpers.errorLoggerHelper(
        'Error at race-candidate/senate-by-district',
        e,
      );
      return exits.notFound();
    }
  },
};
