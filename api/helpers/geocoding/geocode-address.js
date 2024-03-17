const AWS = require('aws-sdk');
const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;
const geohash = require('ngeohash');

// Set the region
AWS.config.update({
  region: 'us-west-2',
  accessKeyId,
  secretAccessKey,
});

// Assuming Amazon Location Service has direct support, adjust accordingly
const location = new AWS.Location();

module.exports = {
  friendlyName: 'Geocode Address',
  description:
    'Returns the latitude and longitude of a given address using AWS geocoding location service.',

  inputs: {
    address: {
      type: 'string',
      example: '450 Serra Mall, Stanford, CA',
      description: 'The address to be geocoded.',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Geocoding was successful.',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const params = {
        IndexName: 'gp-api-location', // Specify your geocoding index name
        Text: inputs.address,
        // Additional parameters as needed
      };

      // Use async/await to wait for the promise to resolve
      const data = await location.searchPlaceIndexForText(params).promise();

      if (data.Results.length === 0) {
        return exits.success(false);
      } else {
        console.log('data.Results', data.Results);
        console.log('data.Results', JSON.stringify(data.Results));
        // Assuming the response data structure has the latitude and longitude
        const lat = data.Results[0].Place.Geometry.Point[1];
        const lng = data.Results[0].Place.Geometry.Point[0];
        const geoHash = geohash.encode(lat, lng, 8);
        return exits.success({ lat, lng, geoHash, full: data.Results[0] });
      }
    } catch (err) {
      console.log('error at geocode-address', err);
      return exits.success(false);
    }
  },
};
