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
      }).sort([{ isIncumbent: 'DESC' }, { combinedRaised: 'DESC' }]);
      const good = [];
      const notGood = [];
      const unknown = [];
      const presidentialThreshold = 50000000;
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const { isGood } = await sails.helpers.goodnessHelper(
          candidate,
          'presidential',
          presidentialThreshold,
        );
        if (isGood === true) {
          good.push({
            ...candidate,
            isGood,
          });
        } else if (isGood === false) {
          notGood.push({
            ...candidate,
            isGood,
          });
        } else {
          unknown.push({
            ...candidate,
            isGood,
          });
        }
      }

      return exits.success({
        presidential: {
          good,
          notGood,
          unknown,
        },
      });
    } catch (e) {
      console.log('Error in find incumbent by id', e);
      return exits.notFound();
    }
  },
};
