// https://googlemaps.github.io/google-maps-services-js/
const googleMaps = require('@googlemaps/google-maps-services-js');

const client = new googleMaps.Client({});
const googleApiKey =
  sails.config.custom.googleApiKey || sails.config.googleApiKey;

module.exports = {
  inputs: {
    addressesWithId: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const { addressesWithId } = inputs;
    try {
      if (!addressesWithId || addressesWithId.length === 0) {
        return false;
      }
      const addresses = addressesWithId.map((address) => address.address);
      const request = {
        params: {
          key: googleApiKey,
          optimize: true,
          waypoints: addresses,
          origin: addresses[0],
          destination: addresses[0],
          mode: 'walking',
        },
      };
      const response = await client.directions(request);
      if (response.data.status === 'OK') {
        const waypoints = response.data.routes[0].waypoint_order;
        const optimizedAddresses = waypoints.map(
          (waypoint) => addressesWithId[waypoint],
        );
        return exits.success({
          optimizedAddresses,
          response: response.data,
        });
      }
      return exits.success(false);
    } catch (err) {
      console.log('error at geocode-address', err);
      await sails.helpers.slack.errorLoggerHelper(
        'Calculating route error',
        err,
      );
      return exits.success(false);
    }
  },
};
