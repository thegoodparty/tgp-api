const getAssistantCompletion = require('../../../../utils/ai/getAssistantCompletion');
const getChatSystemPrompt = require('../../../../utils/ai/getChatSystemPrompt');

const openAiAssistant =
  sails.config.custom.openAiAssistant || sails.config.openAiAssistant;

module.exports = {
  inputs: {
    chatId: {
      type: 'string',
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
      description: 'Campaign Found',
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

      let { chatId, regenerate, message } = inputs;
      if (!user) {
        return exits.badRequest();
      }

      let aiChat;
      let threadId;
      let campaign;
      let messages;

      if (regenerate && !chatId) {
        return exits.badRequest();
      }

      if (!chatId) {
        // Create a new chat
        campaign = await Campaign.findOne({ user: user.id });
      } else {
        aiChat = await AIChat.findOne({ id: chatId, user: user.id });
        messages = aiChat?.data?.messages || [];
        threadId = aiChat?.thread;
        campaign = await Campaign.findOne({ id: aiChat?.campaign });
      }

      console.log('chatId', chatId);
      console.log('threadId', threadId);
      console.log('regenerate', regenerate);
      //   console.log('message', message);

      const { content } = await getChatSystemPrompt(campaign);

      let messageId;
      if (regenerate) {
        // get the second to last message from the thread
        message = messages.slice(-2, -1)[0]?.content;
        console.log('message', message);
        // we will retry the message after deleting the last assistant message
        const lastMessage = messages.slice(-1)[0];
        console.log('lastMessage', lastMessage);
        // get the message id from the last assistant message in the thread for deletion.
        messageId = lastMessage?.id;
        console.log('messageId', messageId);
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

        if (aiChat) {
          if (messageId) {
            // remove the last two messages
            messages.splice(-1, 1);
            messages.splice(-1, 1);
          }

          await AIChat.updateOne({ id: aiChat.id }).set({
            data: {
              messages: [...messages, chatMessage, chatResponse],
            },
          });
        } else {
          await AIChat.create({
            assistant: openAiAssistant,
            thread: completion.threadId,
            user: user.id,
            campaign: campaign.id,
            data: {
              messages: [chatMessage, chatResponse],
            },
          });
        }
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
