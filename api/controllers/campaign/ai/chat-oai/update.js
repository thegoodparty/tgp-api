const getOpenAiAssistantCompletion = require('../../../../utils/ai/getOpenAiAssistantCompletion');
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

      if (regenerate && !threadId) {
        return exits.badRequest();
      }

      let aiChat = await AIChat.findOne({ thread: threadId, user: user.id });
      if (!aiChat) {
        return exits.badRequest();
      }

      let messages = aiChat?.data?.messages || [];
      let campaign = await Campaign.findOne({ id: aiChat?.campaign });
      const { candidateContext, systemPrompt } = await getChatSystemPrompt(
        campaign,
      );

      let messageId;
      if (regenerate) {
        let aiMessage = messages[messages.length - 1];
        messageId = aiMessage.id;
        messages.pop();
        message = messages[messages.length - 1]?.content;
        messages.pop();
      }

      let chatMessage = {
        role: 'user',
        content: message,
      };

      const completion = await getOpenAiAssistantCompletion(
        systemPrompt,
        candidateContext,
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
            ...aiChat.data,
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
