module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'ok',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      await sails.helpers.queue.consumer();
      await sails.helpers.geocoding.calculateGeoLocation();

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error processing geolocation cron',
        e,
      );
      return exits.badRequest({
        message: 'Error processing geolocation cron.',
      });
    }
  },
};
