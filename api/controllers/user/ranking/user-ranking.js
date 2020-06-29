module.exports = {
  friendlyName: 'Update User Ranking',

  description: 'update chamber ranking for a logged in user.',

  inputs: {},

  exits: {
    success: {
      description: 'Ranking',
    },

    badRequest: {
      description: 'Error fetching ranking',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const reqUser = this.req.user;

      const ranking = await Ranking.find({
        user: reqUser.id,
      });

      return exits.success({
        ranking,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at user/ranking/user-ranking',
        e,
      );
      return exits.badRequest({
        message: 'Error getting ranking',
      });
    }
  },
};
