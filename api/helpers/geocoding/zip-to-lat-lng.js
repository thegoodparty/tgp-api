const axios = require('axios');
const geohash = require('ngeohash');

const googleApiKey =
  sails.config.custom.googleApiKey || sails.config.googleApiKey;

module.exports = {
  friendlyName: 'Geocode Address',
  description:
    'Returns the latitude and longitude of a given address using Google Geocoding API.',

  inputs: {
    zip: {
      type: 'string',
      required: true,
    },

    state: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Geocoding was successful.',
    },
  },

  fn: async function (inputs, exits) {
    const { zip, state } = inputs;
    // console.log('calculating zip to lat lng', zip, state);

    // URL now includes components filter for the USA
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${zip}&components=administrative_area:${state}|country:US&key=${googleApiKey}`;

    try {
      const response = await axios.get(url);

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        return exits.success({});
      } else {
        const location = response.data.results[0].geometry.location;
        const lat = location.lat;
        const lng = location.lng;
        const geoHash = geohash.encode(lat, lng, 8);
        return exits.success({ lat, lng, geoHash });
      }
    } catch (err) {
      console.log('error at zip-to lat lng', err);
      return exits.success({});
    }
  },
};
