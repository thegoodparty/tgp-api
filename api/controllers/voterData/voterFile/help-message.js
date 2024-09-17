const {
  appEnvironment,
  PRODUCTION_ENV,
} = require('../../../utils/appEnvironment');

module.exports = {
  inputs: {
    type: {
      type: 'string',
      required: true,
    },
    message: {
      type: 'string',
      required: true,
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
      const { type, message } = inputs;
      const { user } = this.req;
      const { firstName, lastName, email } = user;

      await sails.helpers.slack.slackHelper(
        {
          title: 'Voter File Help Request',
          body: `${firstName} ${lastName} (${email}) needs assistance with ${type} voter file.
￮ Type: ${type}
￮ Message: ${message}
￮ User: ${firstName} ${lastName} (${email})
`,
        },
        appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
      );

      return exits.success({ message: 'ok' });
    } catch (error) {
      console.error('Error voter file help:', error);
      return exits.serverError(error);
    }
  },
};
