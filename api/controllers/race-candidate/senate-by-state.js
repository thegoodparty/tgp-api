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
      }).sort('raised ASC');

      const senateIncumbents = await Incumbent.find({
        state: lowerState,
        chamber: 'Senate',
        isActive: true,
      }).sort('raised ASC');

      senateCandidates.forEach(candidate => {
        candidate.combinedRaised = candidate.raised;
      });

      senateIncumbents.forEach(incumbent => {
        incumbent.isIncumbent = true;
        incumbent.combinedRaised = incumbent.raised + incumbent.pacRaised;
      });

      return exits.success({
        senateCandidates: [...senateIncumbents, ...senateCandidates],
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
