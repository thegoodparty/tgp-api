module.exports = {
  inputs: {
    threadId: {
      type: 'string',
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

      if (threadId) {
        // get a specific chat
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
      } else {
        // get a list of chats.
        const aiChats = await AIChat.find({
          user: this.req.user.id,
        });

        let chats = [];
        for (const chat of aiChats) {
          chats.push({
            thread: chat.thread,
            messages: chat.data.messages,
          });
        }

        return exits.success({
          chats,
        });
      }
    } catch (e) {
      console.log('Error at ai/chat/get', e);
      return exits.badRequest({ message: 'Error getting chat messages.' });
    }
  },
};
