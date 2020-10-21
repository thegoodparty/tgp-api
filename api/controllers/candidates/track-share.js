module.exports = {
  friendlyName: 'Update User Ranking',

  description: 'update chamber ranking for a logged in user.',

  inputs: {
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

    isIncumbent: {
      description: 'is the candidate an incumbent',
      example: false,
      required: false,
      type: 'boolean',
    },
    uuid: {
      required: true,
      type: 'string',
      description: 'user or guest uuid',
    },
  },

  exits: {
    success: {
      description: 'Sharing Tracked',
    },

    badRequest: {
      description: 'Error tracking sharing',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidateId, chamber, isIncumbent, uuid } = inputs;

      await Share.create({
        candidateId,
        chamber,
        isIncumbent,
        uuid,
      });

      const shares = await Share.count({
        candidateId,
        chamber,
        isIncumbent,
      });

      return exits.success({
        shares,
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
