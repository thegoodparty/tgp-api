/**
 * district/total-supporters.js
 *
 * @description :: total supporters = total users.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */


module.exports = {
  friendlyName: 'Total Supporters',

  description: 'Total supporters is our total users.',

  inputs: {},

  exits: {
    success: {
      description: 'Returns supporters count',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error getting supporters',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const count = await User.count();

      return exits.success({
        count,
      });
    } catch (err) {
      console.log('error at total supporters', err);
      return exits.badRequest({
        message: 'Error getting supporters count',
      });
    }
  },
};
