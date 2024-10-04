module.exports = {
  inputs: {},

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
      // get a list of chats.
      const aiChats = await AIChat.find({
        user: this.req.user.id,
      }).sort([{ updatedAt: 'DESC' }]);

      let chats = [];
      for (const chat of aiChats) {
        console.log('chat', chat.data.messages);
        chats.push({
          threadId: chat.thread,
          updatedAt: chat.updatedAt,
          name:
            chat.data?.messages?.length > 0
              ? chat.data.messages[0].content
              : '',
        });
      }

      return exits.success({
        chats,
      });
    } catch (e) {
      console.log('Error at ai/chat/get', e);
      return exits.badRequest({ message: 'Error getting chat messages.' });
    }
  },
};
