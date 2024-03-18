const { Client } = require('@googlemaps/google-maps-services-js');
const googleApiKey =
  sails.config.custom.googleApiKey || sails.config.googleApiKey;

const geoHashSize = 5;
module.exports = {
  inputs: {
    campaignId: {
      type: 'number',
      required: true,
    },
    minHousesPerRoute: {
      type: 'number',
      required: true,
    },
    maxHousesPerRoute: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { campaignId, maxHousesPerRoute, minHousesPerRoute } = inputs;
      console.log('campaignId', campaignId);
      const voters = await Voter.find()
        .populate('campaigns', {
          where: { id: campaignId },
        })
        .sort('geoHash ASC');
      const groupedVoters = generateVoterGroups(
        voters,
        minHousesPerRoute,
        maxHousesPerRoute,
      );

      let index = 0;
      for (const hash of Object.keys(groupedVoters)) {
        if (index === 2) {
          console.log('hash', hash, groupedVoters[hash].length);
          const waypoints = groupedVoters[hash].map((voter) => {
            return {
              lat: parseFloat(voter.lng),
              lng: parseFloat(voter.lat),
            };
          });
          console.log('waypoints', waypoints);

          // generateOptimizedRoute(waypoints);
        }
        index++;
      }

      return exits.success({ groupedVoters });
    } catch (err) {
      console.log('error at geocode-address', err);
      return exits.success(false);
    }
  },
};

async function generateOptimizedRoute(waypoints) {
  try {
    const client = new Client({});

    const params = {
      origin: `${waypoints[0].lat},${waypoints[0].lng}`,
      destination: `${waypoints[waypoints.length - 1].lat},${
        waypoints[waypoints.length - 1].lng
      }`,
      waypoints: waypoints.slice(1, waypoints.length - 1).map((waypoint) => ({
        lat: waypoint.lat,
        lng: waypoint.lng,
      })),
      optimize: true,
      mode: 'walking',
      key: googleApiKey,
    };

    const response = await client.directions({ params });

    // Extract the optimized route from the response
    // const optimizedRoute = response.data.routes[0];

    console.log('Optimized route:', response);
    console.log('=====================');

    // Print the optimized route's legs (steps)
    // optimizedRoute.legs.forEach((leg, index) => {
    //   console.log(`Leg ${index + 1}:`);
    //   leg.steps.forEach((step, stepIndex) => {
    //     console.log(`- ${stepIndex + 1}. ${step.html_instructions}`);
    //   });
    // });
  } catch (error) {
    console.error('Error:', error);
  }
}

function generateVoterGroups(voters, minHousesPerRoute, maxHousesPerRoute) {
  const votersByGeoHash = groupAndSplitByGeoHash(
    voters,
    geoHashSize,
    maxHousesPerRoute,
  );
  const combined = combineEntries(votersByGeoHash, minHousesPerRoute);
  return combined;
}

// group hashes that are smaller than the minimum number of houses per route into larger hashes
function combineEntries(votersByGeoHash, minHousesPerRoute) {
  let result = {};
  let currentHash = '';
  let currentVoters = [];
  for (let hash of Object.keys(votersByGeoHash)) {
    const currLength = votersByGeoHash[hash].length;

    if (currLength > minHousesPerRoute) {
      currentHash += hash;
      result[currentHash] = currentVoters.concat(votersByGeoHash[hash]);
      currentHash = '';
      currentVoters = [];
    } else if (currentVoters.length + currLength < minHousesPerRoute) {
      currentVoters = currentVoters.concat(votersByGeoHash[hash]);
      currentHash += `${hash}_`;
    } else {
      currentHash += hash;
      result[currentHash] = currentVoters.concat(votersByGeoHash[hash]);
      currentHash = '';
      currentVoters = [];
    }
  }
  // add the last one if it was not added
  if (!result[currentHash]) {
    result[currentHash] = currentVoters;
  }
  return result;
}

// recursive function to group voters by geohash and split long lists
function groupAndSplitByGeoHash(voters, initialPrecision, maxHousesPerRoute) {
  let votersByGeoHash = groupVotersByHash(voters, initialPrecision);
  //   console.log('votersByGeoHash', votersByGeoHash, initialPrecision);
  for (let hash of Object.keys(votersByGeoHash)) {
    if (votersByGeoHash[hash].length > maxHousesPerRoute) {
      const smallerGroup = groupAndSplitByGeoHash(
        votersByGeoHash[hash],
        initialPrecision + 1,
        maxHousesPerRoute,
      );
      delete votersByGeoHash[hash];
      votersByGeoHash = Object.assign(votersByGeoHash, smallerGroup);
    }
  }

  return votersByGeoHash;
}

function groupVotersByHash(voters, precision) {
  const votersByGeoHash = {};
  for (const voter of voters) {
    const geoHash = voter.geoHash.substr(0, precision);
    if (geoHash) {
      if (!votersByGeoHash[geoHash]) {
        votersByGeoHash[geoHash] = [];
      }
      votersByGeoHash[geoHash].push(voter);
    }
  }
  return votersByGeoHash;
}
