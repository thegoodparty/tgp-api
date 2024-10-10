const { isIn } = require('validator');
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
    type: {
      type: 'string',
      required: true,
      isIn: ['positive', 'negative'],
    },
    message: {
      type: 'string',
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

      let { threadId, type, message } = inputs;

      let aiChat = await AIChat.findOne({ thread: threadId, user: user.id });
      if (!aiChat) {
        return exits.badRequest();
      }

      await AIChat.updateOne({ id: aiChat.id }).set({
        data: {
          ...aiChat.data,
          feedback: {
            type,
            message,
          },
        },
      });

      await sails.helpers.slack.slackHelper(
        {
          title: `${type} feedback on AI Chat thread`,
          body: `${type} feedback on AI Chat thread
User: ${user.email}
${message ? `Message: ${message}` : ''}
Thread ID: ${threadId}
Last Message on thread: ${
            aiChat?.data?.messages[aiChat?.data?.messages.length - 1]?.content
          }`,
        },
        'user-feedback',
      );

      return exits.success({ message: 'ok' });
    } catch (e) {
      console.log('Error giving AI chat feedback', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error generating AI chat',
        e,
      );
      if (e.data && e.data.error) {
        console.log('*** error*** :', e.data.error);
      }
      return exits.badRequest();
    }
  },
};
