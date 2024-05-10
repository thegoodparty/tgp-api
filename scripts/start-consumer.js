// This is a script to start the SQS consumer as a post-deployment hook.
// It can be run manually via `sails run start-consumer.js`

module.exports = {
  friendlyName: 'Start SQS Consumer',

  description: 'Starts the SQS Consumer',

  inputs: {},

  exits: {},

  fn: async function (inputs, exits) {
    console.log('Starting sqs consumer');
    // todo: loop here and start the consumer again if it fails ?
    await sails.helpers.slack.errorLoggerHelper('Starting SQS Consumer', {});
    try {
      await sails.helpers.queue.consumer();
    } catch (e) {
      console.log('Error at start-consumer', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Uncaught Error at start-consumer',
        e,
      );
    }
  },
};
