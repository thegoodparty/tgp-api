module.exports = {
  friendlyName: 'User candidate ranking',

  description: 'Get User Ranking for a specific candidate',

  inputs: {
    id: {
      type: 'number',
      required: true,
      description: 'candidate id. can be presidential, senate or house',
      example: 1,
    },

    chamber: {
      type: 'string',
      required: true,
      description:
        'chamber of the candidate. can be presidential, senate or house',
      example: 'presidential',
    },

    isIncumbent: {
      type: 'boolean',
      required: false,
      description: 'is the candidate incumbent',
      example: false,
    },
  },

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
      const { id, chamber, isIncumbent } = inputs;

      const rank = await Ranking.findOne({
        user: reqUser.id,
        candidate: id,
        chamber,
        isIncumbent,
      });

      return exits.success({
        rank,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at user/ranking/candidate-ranking',
        e,
      );
      return exits.badRequest({
        message: 'Error getting ranking',
      });
    }
  },
};
