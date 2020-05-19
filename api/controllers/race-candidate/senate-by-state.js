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
      }).sort('raised DESC');

      const senateIncumbents = await Incumbent.find({
        state: lowerState,
        chamber: 'Senate',
        isActive: true,
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
        const candidate = sortedCandidates.candidates.good[i];
        const ranking = await Ranking.count({
          candidate: candidate.id,
          chamber: 'senate',
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
          chamber: 'senate',
          isIncumbent: candidate.isIncumbent,
        });
        candidate.ranking = ranking;
        if (ranking > topRank) {
          topRank = ranking;
        }
      }

      return exits.success({
        senateCandidates: { ...sortedCandidates.candidates, topRank },
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
