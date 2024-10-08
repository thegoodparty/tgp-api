module.exports = {
  inputs: {
    threadId: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
    notFound: {
      description: 'notFound',
      responseType: 'notFound',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { threadId } = inputs;

      await AIChat.destroyOne({
        thread: threadId,
        user: this.req.user.id,
      });

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('Error at ai/chat/delete', e);
      return exits.badRequest({ message: 'Error deleting chat messages.' });
    }
  },
};
