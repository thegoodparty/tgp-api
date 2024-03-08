const googleApiKey =
  sails.config.custom.googleApiKey || sails.config.googleApiKey;

module.exports = {
  inputs: {},

  fn: async function (inputs, exits) {
    try {
      const { Client } = require('@googlemaps/google-maps-services-js');

      const client = new Client({});

      client
        .geocode({
          params: {
            address: 'Northview Township 1A, Michigan, USA',
            region: 'us',
            language: 'en',
            key: googleApiKey,
          },
          timeout: 1000, // milliseconds
        })
        .then((r) => {
          // convert to json before printing
          // and make sure it prints all the nested objects
          //   console.log(r.data.results);
          console.log(JSON.stringify(r.data.results, null, 2));
        })
        .catch((e) => {
          console.log(e.response.data.error_message);
        });
    } catch (e) {
      console.log('error at helpers/google/geocode', e);
      await sails.helpers.slack.errorLoggerHelper(
        'error at helpers/google/geocode',
        e,
      );
      throw e;
    }
    console.log('finished!');
  },
};
