module.exports = {
  friendlyName: 'Delete User Ranking',

  description: 'delete house and senate ranking for a logged in user.',

  inputs: {},

  exits: {
    success: {
      description: 'User successfully updated.',
    },

    badRequest: {
      description: 'Error updating user',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const reqUser = this.req.user;
      await Ranking.destroy({
        chamber: { '!=': 'presidential' },
        user: reqUser.id,
      });

      return exits.success({
        message: 'Ranking deleted',
      });
    } catch (e) {
      console.log('error deleting ranking', e);
      return exits.badRequest({
        message: 'Error deleting ranking',
      });
    }
  },
};
