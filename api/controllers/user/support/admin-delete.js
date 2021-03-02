module.exports = {
  friendlyName: 'Remove user supports a candidate',

  inputs: {
    supportId: {
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
      const { supportId } = inputs;

      await Support.destroyOne({
        id: supportId,
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
