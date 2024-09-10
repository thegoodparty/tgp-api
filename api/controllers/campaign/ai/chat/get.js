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
  },
  fn: async function (inputs, exits) {
    try {
      const { threadId } = inputs;

      const aiChat = await AIChat.findOne({
        thread: threadId,
        user: this.req.user.id,
      });

      if (!aiChat) {
        return exits.badRequest('Invalid chat session');
      }

      let messages = [];
      messages = aiChat.data.messages || [];

      return exits.success({
        messages,
      });
    } catch (e) {
      console.log('Error at ai/chat/get', e);
      return exits.badRequest({ message: 'Error getting chat messages.' });
    }
  },
};
