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
      const houseReps = await RaceCandidate.find({
        state,
        district,
        chamber: 'House',
      });
      const senateReps = await RaceCandidate.find({ state, chamber: 'Senate' });

      const houseCandidates = [];
      for (let i = 0; i < houseReps.length; i++) {
        const rep = houseReps[i];
        const {
          totalRaised,
          largeDonorsPerc,
        } = await sails.helpers.candidateHelper(rep);
        houseCandidates.push({
          ...rep,
          totalRaised,
          largeDonorsPerc,
          isIncumbent: false,
        });
      }

      const senateCandidates = [];
      for (let i = 0; i < senateReps.length; i++) {
        const rep = senateReps[i];
        const {
          totalRaised,
          largeDonorsPerc,
        } = await sails.helpers.candidateHelper(rep);
        senateCandidates.push({
          ...rep,
          totalRaised,
          largeDonorsPerc,
          isIncumbent: false,
        });
      }

      return exits.success({
        houseCandidates,
        senateCandidates,
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
