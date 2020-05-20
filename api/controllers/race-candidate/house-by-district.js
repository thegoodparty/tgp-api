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
      const { state, district } = inputs;
      const lowerState = state.toLowerCase();

      const houseIncumbents = await Incumbent.find({
        state: lowerState,
        district,
        chamber: 'House',
        isActive: true,
      }).sort('raised DESC');

      const houseCandidates = await RaceCandidate.find({
        state: lowerState,
        district,
        chamber: 'House',
        isActive: true,
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
        const candidate = sortedCandidates.candidates.good[i];
        const ranking = await Ranking.count({
          candidate: candidate.id,
          chamber: 'house',
          isIncumbent: candidate.isIncumbent,
        });
        candidate.ranking = ranking;
        if (ranking > topRank) {
          topRank = ranking;
        }
      }

      for (let i = 0; i < sortedCandidates.candidates.unknown.length; i++) {
        const candidate = sortedCandidates.candidates.unknown[i];
        const ranking = await Ranking.count({
          candidate: candidate.id,
          chamber: 'house',
          isIncumbent: candidate.isIncumbent,
        });
        candidate.ranking = ranking;
        if (ranking > topRank) {
          topRank = ranking;
        }
      }

      let threshold = 38658139; // presidential
      const stateRecord = await State.findOne({ shortName: lowerState });

      const congDistrict = await CongDistrict.findOne({
        state: stateRecord.id,
        code: district,
      });
      if (congDistrict) {
        threshold =
          Math.max(
            congDistrict.writeInThreshold,
            congDistrict.writeInThresholdWithPresident,
          ) + 1;
      }

      return exits.success({
        houseCandidates: { ...sortedCandidates.candidates, topRank, threshold },
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
