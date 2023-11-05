module.exports = {
  friendlyName: 'Test ai generation',

  inputs: {
    prompt: {
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'OK',
    },

    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
    // forbidden: {
    //   description: 'Unauthorized',
    //   responseType: 'forbidden',
    // },
  },

  async fn(inputs, exits) {
    try {
      const { prompt } = inputs;
      //   const { user } = this.req;

      //   const candidate = await Candidate.findOne({ id: candidateId });
      //   const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      //   if (!canAccess || canAccess === 'staff') {
      //     return exits.forbidden();
      //   }
      // const response = await sails.helpers.ai.llmCompletion(prompt);
      const response = await sails.helpers.ai.langchainCompletion(prompt);

      return exits.success({
        response,
      });
    } catch (e) {
      console.log('error at ai/test', e);
      return exits.badRequest({
        message: 'Error testing ai',
        e,
      });
    }
  },
};
