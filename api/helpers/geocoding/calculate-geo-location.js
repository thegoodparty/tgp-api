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
    }).limit(500);
    const promises = voters.map((voter) => {
      return new Promise(async (resolve, reject) => {
        const address = `${voter.address} ${voter.city}, ${voter.state} ${voter.zip}`;
        console.log('geocode-address', address);
        const params = {
          IndexName: 'gp-api-location', // Specify your geocoding index name
          Text: address,
          // Additional parameters as needed
        };

        try {
          const searchCommand = new SearchPlaceIndexForTextCommand(params);
          const data = await location.send(searchCommand);

          if (data.Results.length === 0) {
            console.log('no results found for', address);
            resolve();
          } else {
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
            resolve();
          }
        } catch (err) {
          console.log('error at geocode-address', err);
          await sails.helpers.slack.errorLoggerHelper(
            'error at geocode-address.',
            {
              error: err,
            },
          );
          resolve(); // continue with other promises even on error
        }
      });
    });

    await Promise.all(promises);
    return exits.success();
  },
};
