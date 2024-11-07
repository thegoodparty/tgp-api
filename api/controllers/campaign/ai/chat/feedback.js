const { isIn } = require('validator');
const getAssistantCompletion = require('../../../../utils/ai/getAssistantCompletion');
const getChatSystemPrompt = require('../../../../utils/ai/getChatSystemPrompt');

const llamaAiAssistant =
  sails.config.custom.llamaAiAssistant || sails.config.llamaAiAssistant;

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

      const lastMsgIndex = aiChat?.data?.messages.length - 1;
      const slackBlocks = buildSlackBlocks(
        type,
        user.email,
        threadId,
        message,
        aiChat?.data?.messages[lastMsgIndex - 1]?.content,
        aiChat?.data?.messages[lastMsgIndex]?.content,
      );

      await sails.helpers.slack.slackHelper(
        slackBlocks,
        'user-feedback',
        false,
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

function buildSlackBlocks(
  type,
  email,
  threadId,
  userMessage,
  userPrompt,
  lastThreadMessage,
) {
  const title = `${
    type.charAt(0).toUpperCase() + type.slice(1)
  } feedback on AI Chat thread`;

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `💬 ${title}`,
          emoji: true,
        },
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_list',
            style: 'bullet',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'User: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(email),
                  },
                ],
              },
              userMessage
                ? {
                    type: 'rich_text_section',
                    elements: [
                      {
                        type: 'text',
                        text: 'Message: ',
                        style: {
                          bold: true,
                        },
                      },
                      {
                        type: 'text',
                        text: String(userMessage),
                      },
                    ],
                  }
                : undefined,
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Thread ID: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(threadId),
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'User Prompt: ',
                    style: {
                      bold: true,
                    },
                  },
                  {
                    type: 'text',
                    text: String(userPrompt),
                  },
                ],
              },
            ].filter((elem) => elem !== undefined),
          },
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: '\n\n',
              },
            ],
          },
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: ' Last Message on Thread:',
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: 'rich_text_preformatted',
            elements: [
              {
                type: 'text',
                text: lastThreadMessage,
              },
            ],
          },
        ],
      },
    ],
  };
}
