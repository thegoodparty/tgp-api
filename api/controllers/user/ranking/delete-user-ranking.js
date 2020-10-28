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

  fn: async function (inputs, exits) {
    try {
      const reqUser = this.req.user;
      const condition = {
        chamber: { '!=': 'presidential' },
        user: reqUser.id,
      };
      const deleteRankings = await Ranking.find(condition);
      for (let i = 0; i < deleteRankings.length; i++) {
        const { chamber, candidate, isIncumbent } = deleteRankings[i];
        const candidateData = await sails.helpers.candidateFinder(
          candidate,
          chamber,
          isIncumbent,
        );
        const { name } = candidateData.candidate;
        await sails.helpers.updateTag(
          reqUser.email,
          'The Good Party',
          `${chamber} ${name}`,
          'inactive'
        );
      }
      await Ranking.destroy(condition);

      return exits.success({
        message: 'Ranking deleted',
      });
    } catch (e) {
      console.log('error deleting ranking', e);
      await sails.helpers.errorLoggerHelper('Error at user/ranking/delete-user-ranking', e);
      return exits.badRequest({
        message: 'Error deleting ranking',
      });
    }
  },
};
