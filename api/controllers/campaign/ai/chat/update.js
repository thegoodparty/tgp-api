const getAssistantCompletion = require('../../../../utils/ai/getAssistantCompletion');
const getChatSystemPrompt = require('../../../../utils/ai/getChatSystemPrompt');

const openAiAssistant =
  sails.config.custom.openAiAssistant || sails.config.openAiAssistant;

module.exports = {
  inputs: {
    threadId: {
      type: 'string',
      required: true,
    },
    message: {
      type: 'string',
    },
    regenerate: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

  exits: {
    success: {
      description: 'Chat Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;

      let { threadId, regenerate, message } = inputs;
      if (!user) {
        return exits.badRequest();
      }

      if (regenerate && !threadId) {
        return exits.badRequest();
      }

      let aiChat = await AIChat.findOne({ thread: threadId, user: user.id });
      if (!aiChat) {
        return exits.badRequest();
      }

      let messages = aiChat?.data?.messages || [];
      let campaign = await Campaign.findOne({ id: aiChat?.campaign });

      console.log('chatId', aiChat.id);
      console.log('threadId', threadId);
      console.log('regenerate', regenerate);

      const { content } = await getChatSystemPrompt(campaign);

      let messageId;
      if (regenerate) {
        message = messages.slice(-2, -1)[0]?.content;
        const lastMessage = messages.slice(-1)[0];
        messageId = lastMessage?.id;
        messages.splice(-1, 1);
        messages.splice(-1, 1);
      }

      let chatMessage = {
        role: 'user',
        content: message,
      };

      const completion = await getAssistantCompletion(
        content,
        openAiAssistant,
        threadId,
        chatMessage,
        messageId,
      );

      console.log('completion', completion);

      let chatResponse;
      if (completion && completion.content) {
        chatResponse = {
          role: 'assistant',
          id: completion.messageId,
          content: completion.content,
          createdAt: completion.createdAt,
          usage,
        };

        await AIChat.updateOne({ id: aiChat.id }).set({
          data: {
            messages: [...messages, chatMessage, chatResponse],
          },
        });

        return exits.success({ message: chatResponse });
      } else {
        return exits.badRequest();
      }
    } catch (e) {
      console.log('Error generating AI chat', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error generating AI chat',
        e,
      );
      if (e.data && e.data.error) {
        console.log('*** error*** :', e.data.error);
        return exits.badRequest();
      }
      return exits.badRequest();
    }
  },
};