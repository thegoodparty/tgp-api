const {
  LocationClient,
  SearchPlaceIndexForTextCommand,
} = require('@aws-sdk/client-location');

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;
const geohash = require('ngeohash');

const location = new LocationClient({
  region: 'us-west-2',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

module.exports = {
  friendlyName: 'Geocode Address',
  description:
    'Returns the latitude and longitude of a given address using AWS geocoding location service.',

  inputs: {
    zip: {
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
    const { zip } = inputs;

    const params = {
      IndexName: 'gp-api-location', // Specify your geocoding index name
      Text: zip,
      MaxResults: 1, // Limit to 1 result
      // Additional parameters as needed
    };

    try {
      const searchCommand = new SearchPlaceIndexForTextCommand(params);
      const data = await location.send(searchCommand);

      if (data.Results.length === 0) {
        console.log('no results found for', address);
        return exits.success({});
      } else {
        const lat = data.Results[0].Place.Geometry.Point[1];
        const lng = data.Results[0].Place.Geometry.Point[0];
        const geoHash = geohash.encode(lat, lng, 8);

        return exits.success({ lat, lng, geoHash });
      }
    } catch (err) {
      console.log('error at zip-to lat lng', err);
      return exits.success({});
    }
  },
};
