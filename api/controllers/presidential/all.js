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
      const candidates = await PresidentialCandidate.find({
        isActive: true,
      }).sort([{ isIncumbent: 'DESC' }, { name: 'ASC' }]);
      // const good = [];
      // const notGood = [];
      // for (let i = 0; i < candidates.length; i++) {
      //   const candidate = candidates[i];
      //   const { isGood } = await sails.helpers.presidentialHelper(candidate);
      //   if (isGood) {
      //     good.push({
      //       ...candidate,
      //       isGood,
      //     });
      //   } else {
      //     notGood.push({
      //       ...candidate,
      //       isGood,
      //     });
      //   }
      // }

      return exits.success({
        presidential: candidates,
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
