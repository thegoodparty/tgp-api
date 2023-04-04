const request = require('request-promise');

module.exports = {
  friendlyName: 'Send Slack message helper',

  description: 'Send SMS using Slack webhook',

  inputs: {
    message: {
      friendlyName: 'Error message',
      description: 'Error message',
      type: 'string',
    },
    error: {
      friendlyName: 'Original Error',
      description: 'Original error from catch',
      type: 'json',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { message, error } = inputs;
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const slackMessage = {
        text: `Error`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `__________________________________ \n *Message from server* \n ${appBase}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${message}*\n\n${JSON.stringify(error)}`,
            },
          },
        ],
      };

      await sails.helpers.slackHelper(slackMessage, 'dev');

      return exits.success({ message: 'slack message sent successfully' });
    } catch (e) {
      // console.log(e);
      return null;
    }
  },
};
