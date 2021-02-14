module.exports = {
  friendlyName: 'Remove user supports a candidate',

  inputs: {
    candidateId: {
      description: 'candidate id',
      example: 1,
      required: true,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Support removed',
    },

    badRequest: {
      description: 'Error creating support',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let reqUser = this.req.user;
      const { candidateId } = inputs;

      await Support.destroyOne({
        user: reqUser.id,
        candidate: candidateId,
      });

      return exits.success({
        message: 'support deleted',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error removing support',
      });
    }
  },
};
