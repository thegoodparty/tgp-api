module.exports = {
  friendlyName: 'Load ai embeddings',

  inputs: {},

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
      //   const { user } = this.req;

      //   const candidate = await Candidate.findOne({ id: candidateId });
      //   const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      //   if (!canAccess || canAccess === 'staff') {
      //     return exits.forbidden();
      //   }
      // const response = await sails.helpers.ai.llmCompletion(prompt);
      const response = await sails.helpers.ai.langchainInsert();

      return exits.success({
        response,
      });
    } catch (e) {
      console.log('error at ai/load', e);
      return exits.badRequest({
        message: 'Error loading ai embeddings',
        e,
      });
    }
  },
};
