module.exports = {
  friendlyName: 'Update User Ranking',

  description: 'update chamber ranking for a logged in user.',

  inputs: {
    rank: {
      description: 'rank position for the candidate',
      example: 1,
      required: true,
      type: 'number',
    },

    candidateId: {
      description: 'candidate id to be ranked',
      example: 1,
      required: true,
      type: 'number',
    },

    chamber: {
      description: 'Candidate chamber',
      example: 'presidential',
      required: true,
      type: 'string',
    },

    state: {
      description: 'State for ranking',
      example: 'ca',
      required: false,
      type: 'string',
    },

    isIncumbent: {
      description: 'is the candidate an incumbent',
      example: false,
      required: false,
      type: 'boolean',
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
  },

  fn: async function(inputs, exits) {
    try {
      let reqUser = this.req.user;
      const { rank, candidateId, chamber, state, isIncumbent } = inputs;
      // first make sure the user doesn't have that ranking already.
      if (!reqUser) {
        return exits.badRequest({
          message: 'Missing User',
        });
      }
      const existingRanking = await Ranking.find({
        user: reqUser.id,
        chamber,
        candidate: candidateId,
        isIncumbent,
      });
      if (existingRanking.length > 0) {
        return exits.badRequest({
          message: 'User already ranked this candidate',
        });
      }
      if (!reqUser.shortState || reqUser.shortState == '') {
        if (state) {
          reqUser = await User.updateOne({ id: reqUser.id }).set({
            shortState: state,
          });
        } else {
          return exits.badRequest({
            message: 'User is missing a state',
            missingState: true,
          });
        }
      }
      await Ranking.create({
        user: reqUser.id,
        chamber,
        candidate: candidateId,
        rank,
        userState: reqUser.shortState,
        isIncumbent,
      });

      const ranking = await Ranking.find({ user: reqUser.id });
      return exits.success({
        ranking,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at user/ranking/rank-candidate',
        e,
      );
      return exits.badRequest({
        message: 'Error ranking candidate',
      });
    }
  },
};
