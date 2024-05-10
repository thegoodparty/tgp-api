// This is a script to test the Slack integration as a post-deployment hook.
// It must be run manually via `sails run slack-alert`

module.exports = {
  friendlyName: 'Test slack',

  description: 'Test the slack integration.',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    console.log('Sending slack post deployment message');
    await sails.helpers.slack.errorLoggerHelper(
      'Sails API server is online.',
      {},
    );
    return exits.success({
      message: 'ok',
    });
  },
};
