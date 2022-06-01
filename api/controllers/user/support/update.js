module.exports = {
  friendlyName: 'Update user supports a candidate',

  inputs: {
    candidateId: {
      description: 'candidate id to be supported',
      example: 1,
      required: true,
      type: 'number',
    },
    message: {
      description: 'personal note from the user',
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Support updated',
    },

    badRequest: {
      description: 'Error updaing support',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let reqUser = this.req.user;
      const { candidateId, message } = inputs;
      // first make sure the user doesn't have that ranking already.
      await Support.updateOne({
        user: reqUser.id,
        candidate: candidateId,
      }).set({ message });

      await sails.helpers.cacheHelper('clear', 'all');

      return exits.success({
        message: 'support updated',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error updating candidate support',
      });
    }
  },
};
