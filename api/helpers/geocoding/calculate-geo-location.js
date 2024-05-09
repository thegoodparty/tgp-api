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

  inputs: {},

  exits: {
    success: {
      description: 'Geocoding was successful.',
    },
  },

  fn: async function (inputs, exits) {
    const voters = await Voter.find({
      pendingProcessing: true,
      geoHash: '',
    }).limit(200);
    for (let i = 0; i < voters.length; i++) {
      try {
        const voter = voters[i];
        const address = `${voter.address} ${voter.city}, ${voter.state} ${voter.zip}`;
        console.log('geocode-address', address);
        const params = {
          IndexName: 'gp-api-location', // Specify your geocoding index name
          Text: address,
          // Additional parameters as needed
        };

        // Use async/await to wait for the promise to resolve
        const data = await location.searchPlaceIndexForText(params).promise();

        if (data.Results.length === 0) {
          console.log('no results found for', address);
          continue;
        } else {
          // Assuming the response data structure has the latitude and longitude
          const lat = data.Results[0].Place.Geometry.Point[1];
          const lng = data.Results[0].Place.Geometry.Point[0];
          const geoHash = geohash.encode(lat, lng, 8);
          await Voter.updateOne({ id: voter.id }).set({
            lat,
            lng,
            geoHash,
            pendingProcessing: false,
            data: { ...voter.data, geoLocation: data.Results[0] },
          });
          await DoorKnockingVoter.update({ voter: voter.id }).set({
            geoHash,
          });
          console.log('updated voter with geoHash', voter.id);
        }
      } catch (err) {
        console.log('error at geocode-address', err);
        await sails.helpers.slack.errorLoggerHelper(
          'error at geocode-address.',
          {
            error: err,
          },
        );
        continue;
      }
    }
    return exits.success();
  },
};
