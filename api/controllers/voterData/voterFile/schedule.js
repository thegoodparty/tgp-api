const {
  appEnvironment,
  PRODUCTION_ENV,
} = require('../../../utils/appEnvironment');

module.exports = {
  inputs: {
    budget: {
      type: 'number',
      required: true,
    },
    audience: {
      type: 'json',
      required: true,
    },
    script: {
      type: 'string',
      required: true,
    },
    date: {
      type: 'string',
      required: true,
    },
    message: {
      type: 'string',
      required: true,
    },
    voicemail: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Bad request',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { budget, audience, script, date, message, voicemail } = inputs;
      const { user } = this.req;
      const { firstName, lastName, email } = user;

      await sails.helpers.slack.slackHelper(
        {
          body: `${firstName} ${lastName} (${email}) is requesting to schedule a campaign.
￮ Budget: $${budget}
￮ Date: ${date}
￮ Message: ${message}
￮ User: ${firstName} ${lastName} (${email})
￮ Script Key: ${script}
￮ Audience: ${JSON.stringify(audience)}
${voicemail ? '￮ Voicemail: Yes' : ''}
`,
        },
        appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
      );

      return exits.success({ message: 'ok' });
    } catch (error) {
      console.error('Error voter file count:', error);
      return exits.serverError(error);
    }
  },
};
