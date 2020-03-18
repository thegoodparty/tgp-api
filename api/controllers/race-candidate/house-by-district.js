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
      const upperState = state.toUpperCase();

      const houseIncumbents = await Incumbent.find({
        state: upperState,
        district,
        chamber: 'House',
      }).sort('name ASC');

      const houseCandidates = await RaceCandidate.find({
        state: upperState,
        district,
        chamber: 'House',
      });

      houseCandidates.forEach(candidate => {
        candidate.combinedRaised = candidate.raised;
      });

      houseIncumbents.forEach(incumbent => {
        incumbent.isIncumbent = true;
        incumbent.combinedRaised = incumbent.raised + incumbent.pacRaised;
      });

      return exits.success({
        houseCandidates: [...houseIncumbents, ...houseCandidates],
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
