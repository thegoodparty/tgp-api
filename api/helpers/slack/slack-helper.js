const request = require('request-promise');
// https://api.slack.com/apps/A0166K4G4E6/incoming-webhooks?

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  friendlyName: 'Send Slack message helper',

  description: 'Send SMS using Slack webhook',

  inputs: {
    message: {
      friendlyName: 'Message to send',
      description: 'Message to send',
      type: 'json',
    },
    channel: {
      friendlyName: 'Channel to post to',
      description: 'dev or content',
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Feedback sent',
    },
    badRequest: {
      description: 'Error sending feedback',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { message, channel } = inputs;
      let slackChannelId;
      const slackAppId =
        sails.config.custom.slackAppId || sails.config.slackAppId;
      let token;
      if (channel === 'dev') {
        token =
          sails.config.custom.slackDevChannelToken ||
          sails.config.slackDevChannelToken;

        slackChannelId =
          sails.config.custom.slackDevChannelId ||
          sails.config.slackDevChannelId;
      } else if (channel === 'victory') {
        token =
          sails.config.custom.slackVictoryChannelToken ||
          sails.config.slackVictoryChannelToken;

        slackChannelId =
          sails.config.custom.slackVictoryChannelId ||
          sails.config.slackVictoryChannelId;
      } else if (channel === 'victory-issues') {
        token =
          sails.config.custom.slackVictoryIssuesChannelToken ||
          sails.config.slackVictoryIssuesChannelToken;

        slackChannelId =
          sails.config.custom.slackVictoryIssuesChannelId ||
          sails.config.slackVictoryIssuesChannelId;
      } else if (channel === 'ai') {
        token =
          sails.config.custom.slackAiChannelToken ||
          sails.config.slackAiChannelToken;

        slackChannelId =
          sails.config.custom.slackAiChannelId || sails.config.slackAiChannelId;
      } else {
        token =
          sails.config.custom.slackContentChannelToken ||
          sails.config.slackContentChannelToken;

        slackChannelId =
          sails.config.custom.slackContentChannelId ||
          sails.config.slackContentChannelId;
      }

      if (!slackChannelId || !slackAppId || !token) {
        throw new Error({
          message: 'Missing Env Variables',
        });
      }

      const options = {
        uri: `https://hooks.slack.com/services/${slackAppId}/${slackChannelId}/${token}`,
        method: 'POST',
        json: true,
        body: message,
      };

      await request(options);

      return exits.success({ message: 'slack message sent successfully' });
    } catch (e) {
      if (appBase !== 'http://localhost:4000') {
        console.log('error at slack-helper', e);
      }
      return exits.success({ message: 'Error sending Slack message' });
    }
  },
};
