/**
 * incumbents/all.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find all Presidential Candidates',

  description: 'Find all Presidential Candidates ',

  inputs: {},

  exits: {
    success: {
      description: 'Presidential Candidates Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Presidential Candidates Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const candidates = await PresidentialCandidate.find();
      const calcCand = [];
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const {
          totalRaised,
          largeDonorsPerc,
          largeDonorPerHour,
          isGood
        } = await sails.helpers.presidentialHelper(candidate);

        calcCand.push({
          ...candidate,
          totalRaised,
          largeDonorsPerc,
          largeDonorPerHour,
          isGood,
        });
      }

      return exits.success({
        presidential: calcCand,
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
