const { initial } = require('lodash');
const getOpenAiAssistantCompletion = require('../../../../utils/ai/getOpenAiAssistantCompletion');
const getChatSystemPrompt = require('../../../../utils/ai/getChatSystemPrompt');

const openAiAssistant =
  sails.config.custom.openAiAssistant || sails.config.openAiAssistant;

module.exports = {
  inputs: {
    message: {
      type: 'string',
      required: true,
    },
    initial: {
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

      if (!user) {
        return exits.badRequest();
      }

      const { message } = inputs;

      // Create a new chat
      let campaign = await sails.helpers.campaign.byUser(user.id);
      const { candidateContext, systemPrompt } = await getChatSystemPrompt(
        campaign,
        initial,
      );

      const chatMessage = {
        role: 'user',
        content: message,
      };

      let threadId;
      let messageId;

      console.log('candidateContext', candidateContext);
      console.log('systemPrompt', systemPrompt);

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
      if (completion && completion?.content) {
        chatResponse = {
          role: 'assistant',
          id: completion.messageId,
          content: completion.content,
          createdAt: completion.createdAt,
          usage,
        };

        await AIChat.create({
          assistant: openAiAssistant,
          thread: completion.threadId,
          user: user.id,
          campaign: campaign.id,
          data: {
            messages: [chatMessage, chatResponse],
          },
        });
        return exits.success({
          chat: [chatMessage, chatResponse],
          threadId: completion.threadId,
        });
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
