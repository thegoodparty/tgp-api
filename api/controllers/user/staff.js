/**
 * user/leaderboard.js
 *
 * @description :: Users sorted by crewCount.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Leaderboard',

  description: 'Users sorted by crewCount',
  exits: {
    success: {
      description: 'Check passed.',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Bad token',
      responseType: 'forbidden',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { user } = this.req;
      const staff = await Staff.find({
        user: user.id,
      }).populate('candidate');

      return exits.success({
        staff,
      });
    } catch (e) {
      console.log('error at user/leaderboard');
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at user/leaderboardw', e);
      return exits.forbidden();
    }
  },
};
