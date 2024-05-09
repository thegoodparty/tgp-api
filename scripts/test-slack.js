// This is a script to test the Slack integration as a post-deployment hook.
// It must be run manually via `sails run test-slack.js`

module.exports = {
  friendlyName: 'Test slack',

  description: 'Test the slack integration.',

  inputs: {},

  exits: {},

  fn: async function (inputs, exits) {
    console.log('Testing slack post deployment hooks');
    await sails.helpers.slack.errorLoggerHelper(
      'Testing post deployment hooks',
      {},
    );
  },
};
