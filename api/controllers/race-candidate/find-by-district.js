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

      const houseGood = [];
      const houseNotGood = [];
      for (let i = 0; i < houseReps.length; i++) {
        const rep = houseReps[i];
        const {
          totalRaised,
          largeDonorsPerc,
          isGood,
        } = await sails.helpers.candidateHelper(rep);
        if (isGood) {
          houseGood.push({
            ...rep,
            totalRaised,
            largeDonorsPerc,
            isGood,
            isIncumbent: false,
          });
        } else {
          houseNotGood.push({
            ...rep,
            totalRaised,
            largeDonorsPerc,
            isGood,
            isIncumbent: false,
          });
        }
      }

      const senateGood = [];
      const senateNotGood = [];
      for (let i = 0; i < senateReps.length; i++) {
        const rep = senateReps[i];
        const {
          totalRaised,
          largeDonorsPerc,
          isGood,
        } = await sails.helpers.candidateHelper(rep);
        if (isGood) {
          senateGood.push({
            ...rep,
            totalRaised,
            largeDonorsPerc,
            isGood,
            isIncumbent: false,
          });
        } else {
          senateNotGood.push({
            ...rep,
            totalRaised,
            largeDonorsPerc,
            isGood,
            isIncumbent: false,
          });
        }
      }

      return exits.success({
        houseCandidates: { good: houseGood, notGood: houseNotGood },
        senateCandidates: { good: senateGood, notGood: senateNotGood },
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
