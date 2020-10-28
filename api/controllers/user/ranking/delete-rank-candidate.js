module.exports = {
  friendlyName: 'Delete User Ranking',

  description: 'delete user ranking',

  inputs: {
    id: {
      description: 'Ranking id',
      example: 1,
      required: true,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Ranking created',
    },

    badRequest: {
      description: 'Error creating ranking',
      responseType: 'badRequest',
    },

    forbidden: {
      description: 'This ranking  does not belong to this user',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const reqUser = this.req.user;
      const { id } = inputs;
      // first make sure the user doesn't have that ranking already.

      const ranking = await Ranking.findOne({
        id,
      });
      if (!ranking) {
        return exits.badRequest({
          message: 'Ranking not found',
        });
      }
      if (ranking.user !== reqUser.id) {
        return exits.forbidden({
          message: 'This ranking  does not belong to this user',
        });
      }
      // product logic - delete all the chamber ranking with higher ranking.
      // await Ranking.destroyOne({ id });
      const condition = {
        rank: { '>=': ranking.rank },
        chamber: ranking.chamber,
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

      const candidate = await sails.helpers.findCandidateWithFields(
        ranking.candidate,
        ranking.chamber,
        !!ranking.isIncumbent,
      );

      return exits.success({
        candidate
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at user/ranking/detelet-rank-candidate', e);
      return exits.badRequest({
        message: 'Error deleting ranking',
      });
    }
  },
};
