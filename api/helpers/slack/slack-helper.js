// https://api.slack.com/apps/A0166K4G4E6

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
    addMarkdown: {
      friendlyName: 'Add markdown',
      description: 'Add markdown to the message',
      type: 'boolean',
      defaultsTo: true,
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
      let { message, channel, addMarkdown } = inputs;
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
      } else if (channel === 'user-feedback') {
        token =
          sails.config.custom.slackUserFeedbackChannelToken ||
          sails.config.slackUserFeedbackChannelToken;

        slackChannelId =
          sails.config.custom.slackUserFeedbackChannelId ||
          sails.config.slackUserFeedbackChannelId;
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
      } else if (channel === 'politics') {
        token =
          sails.config.custom.slackPoliticsChannelToken ||
          sails.config.slackPoliticsChannelToken;

        slackChannelId =
          sails.config.custom.slackPoliticsChannelId ||
          sails.config.slackPoliticsChannelId;
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

      if (addMarkdown) {
        message = simpleSlackMessage(message.title, message.body);
      }
      const slackUrl = `https://hooks.slack.com/services/${slackAppId}/${slackChannelId}/${token}`;
      const response = await fetch(slackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        console.log('error at slack-helper', response);
      }

      return exits.success({ message: 'slack message sent successfully' });
    } catch (e) {
      if (appBase !== 'http://localhost:4000') {
        console.log('error at slack-helper', e);
      }
      return exits.success({ message: 'Error sending Slack message' });
    }
  },
};

function simpleSlackMessage(text, body) {
  console.log('text', text);
  console.log('body', body);
  return {
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: body,
        },
      },
    ],
  };
}
