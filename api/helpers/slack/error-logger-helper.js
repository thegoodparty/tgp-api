// https://api.slack.com/apps/A0166K4G4E6

const appBase = sails.config.custom.appBase || sails.config.appBase;

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

      await sails.helpers.slack.slackHelper(slackMessage, 'dev', false);

      return exits.success({ message: 'slack message sent successfully' });
    } catch (e) {
      if (appBase !== 'http://localhost:4000') {
        console.log('error in error-logger-helper', e);
      }
      return null;
    }
  },
};
