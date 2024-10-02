const getAssistantCompletion = require('../../../../utils/ai/getAssistantCompletion');
const getChatSystemPrompt = require('../../../../utils/ai/getChatSystemPrompt');

const openAiAssistant =
  sails.config.custom.openAiAssistant || sails.config.openAiAssistant;

module.exports = {
  inputs: {},

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

      // Create a new chat
      let campaign = await sails.helpers.campaign.byUser(user.id);
      const { candidateContext, systemPrompt } = await getChatSystemPrompt(
        campaign,
      );

      let chatMessage = {
        role: 'user',
        content: 'Hi, I need help with my campaign.',
      };

      let threadId;
      let messageId;

      console.log('candidateContext', candidateContext);
      console.log('systemPrompt', systemPrompt);

      const completion = await getAssistantCompletion(
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
          chat: chatResponse,
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
