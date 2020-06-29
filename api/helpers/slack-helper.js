const request = require('request-promise');

module.exports = {
  friendlyName: 'Send Slack message helper',

  description: 'Send SMS using Slack webhook',

  inputs: {
    message: {
      friendlyName: 'Message to send',
      description: 'Message to send',
      type: 'json',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { message } = inputs;
      const slackChannelId =
        sails.config.custom.slackChannelId || sails.config.slackChannelId;
      const slackAppId =
        sails.config.custom.slackAppId || sails.config.slackAppId;
      const slackAuthToken =
        sails.config.custom.slackAuthToken || sails.config.slackAuthToken;

      if (!slackChannelId || !slackAppId || !slackAuthToken) {
        throw 'badRequest';
      }

      const options = {
        uri: `https://hooks.slack.com/services/${slackAppId}/${slackChannelId}/${slackAuthToken}`,
        method: 'POST',
        json: true,
        body: message,
      };

      await request(options);

      return exits.success({ message: 'slack message sent successfuly' });
    } catch (e) {
      throw 'badRequest';
    }
  },
};
