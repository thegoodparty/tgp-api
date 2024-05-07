// https://googlemaps.github.io/google-maps-services-js/
const googleMaps = require('@googlemaps/google-maps-services-js');

const client = new googleMaps.Client({});
const googleApiKey =
  sails.config.custom.googleApiKey || sails.config.googleApiKey;

const GEO_HASH_SIZE = 5;
const MIN_HOUSES_PER_ROUTE = 10;
module.exports = {
  inputs: {
    campaignId: {
      type: 'number',
      required: true,
    },
    dkCampaignId: {
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
      const { campaignId, maxHousesPerRoute, dkCampaignId } = inputs;
      // console.log('campaignId', campaignId);
      await sails.helpers.slack.errorLoggerHelper('Calculating routes ', {
        campaignId,
      });
      const cappedMaxHousesPerRoute = Math.min(maxHousesPerRoute, 25);
      const campaign = await Campaign.findOne({ id: campaignId }).populate(
        'voters',
      );
      const voters = campaign.voters;
      console.log('voters', voters.length);
      console.log('campaign', campaign);

      await sails.helpers.slack.errorLoggerHelper('Calculating routes2 ', {
        voterCount: voters.length,
      });
      const groupedVoters = generateVoterGroups(
        voters,
        MIN_HOUSES_PER_ROUTE,
        cappedMaxHousesPerRoute,
      );
      const routesCount = Object.keys(groupedVoters).length;
      const maxRoutes = Math.min(routesCount, 10);

      for (let i = 0; i < routesCount; i++) {
        const hash = Object.keys(groupedVoters)[i];
        const addresses = groupedVoters[hash].map((voter) => {
          return {
            voterId: voter.id,
            address: `${voter.address}, ${voter.city}, ${voter.state} ${voter.zip}`,
            lat: voter.lat,
            lng: voter.lng,
          };
        });
        if (addresses.length === 0) {
          await sails.helpers.slack.errorLoggerHelper('Getting empty routes', {
            campaignId,
            groupedVoters,
          });
          continue;
        }
        // console.log('addresses', addresses);

        if (i < maxRoutes) {
          const route = await sails.helpers.geocoding.generateOptimizedRoute(
            addresses,
          );
          if (route) {
            await DoorKnockingRoute.create({
              data: route,
              dkCampaign: dkCampaignId,
            });
          }
        } else {
          await DoorKnockingRoute.create({
            data: {
              groupedRoute: addresses,
            },
            dkCampaign: dkCampaignId,
            status: 'not-calculated',
          });
        }
      }

      return exits.success({ groupedVoters });
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

function generateVoterGroups(voters, minHousesPerRoute, maxHousesPerRoute) {
  const votersByGeoHash = groupAndSplitByGeoHash(
    voters,
    GEO_HASH_SIZE,
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

// group voters by geohash and split long lists
function groupAndSplitByGeoHash(voters, initialPrecision, maxHousesPerRoute) {
  let queue = [{ voters, precision: initialPrecision }];
  let result = {};

  while (queue.length > 0) {
    console.log('in iteration', queue.length);
    const { voters, precision } = queue.shift();
    let votersByGeoHash = groupVotersByHash(voters, precision);

    for (let hash of Object.keys(votersByGeoHash)) {
      const hashLength = votersByGeoHash[hash].length;
      if (hashLength > maxHousesPerRoute && precision < 11) {
        queue.push({ voters: votersByGeoHash[hash], precision: precision + 1 });
      } else {
        result[hash] = votersByGeoHash[hash];
      }
    }
  }

  return result;
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

/*
const res = {
  geocoded_waypoints: [
    {
      geocoder_status: 'OK',
      place_id: 'ChIJQx0zPc0l6IARV93cVTx8d04',
      types: ['premise'],
    },
    {
      geocoder_status: 'OK',
      place_id: 'ChIJtYrEMM0l6IAR5k3OGKWYM7M',
      types: ['premise'],
    },
    {
      geocoder_status: 'OK',
      place_id: 'ChIJoaW6uc0l6IARRX2laSlsgUI',
      types: ['premise'],
    },
    {
      geocoder_status: 'OK',
      place_id: 'ChIJBygzsc0l6IARGmIO8TlR88g',
      types: ['premise'],
    },
    {
      geocoder_status: 'OK',
      place_id: 'ChIJszWZac8l6IARsktnJNTbEiI',
      types: ['premise'],
    },
    {
      geocoder_status: 'OK',
      place_id: 'ChIJTRRzc88l6IARWWicVNgthCM',
      types: ['premise'],
    },
    {
      geocoder_status: 'OK',
      place_id: 'ChIJp82F_c4l6IARc_3iquyfFCE',
      types: ['premise'],
    },
    {
      geocoder_status: 'OK',
      place_id: 'ChIJU47rRM4l6IARdQV45ha6tpw',
      types: ['premise'],
    },
    {
      geocoder_status: 'OK',
      place_id: 'ChIJQx0zPc0l6IARV93cVTx8d04',
      types: ['premise'],
    },
  ],
  routes: [
    {
      bounds: {
        northeast: { lat: 34.1867798, lng: -118.7752938 },
        southwest: { lat: 34.177392, lng: -118.784523 },
      },
      copyrights: 'Map data ©2024',
      legs: [
        {
          distance: { text: '167 ft', value: 51 },
          duration: { text: '1 min', value: 43 },
          end_address: '5198 Evanwood Ave, Oak Park, CA 91377, USA',
          end_location: { lat: 34.1787112, lng: -118.7799076 },
          start_address: '5169 Evanwood Ave, Oak Park, CA 91377, USA',
          start_location: { lat: 34.1789023, lng: -118.7804078 },
          steps: [
            {
              distance: { text: '167 ft', value: 51 },
              duration: { text: '1 min', value: 43 },
              end_location: { lat: 34.1787112, lng: -118.7799076 },
              html_instructions:
                'Head <b>southeast</b> on <b>Evanwood Ave</b> toward <b>Portsmouth Ct</b>',
              polyline: { points: 'cqroEph~sUd@cB' },
              start_location: { lat: 34.1789023, lng: -118.7804078 },
              travel_mode: 'WALKING',
            },
          ],
          traffic_speed_entry: [],
          via_waypoint: [],
        },
        {
          distance: { text: '0.8 mi', value: 1286 },
          duration: { text: '18 mins', value: 1107 },
          end_address: '566 Kellwood Ct, Oak Park, CA 91377, USA',
          end_location: { lat: 34.1815555, lng: -118.7803609 },
          start_address: '5198 Evanwood Ave, Oak Park, CA 91377, USA',
          start_location: { lat: 34.1787112, lng: -118.7799076 },
          steps: [
            {
              distance: { text: '0.1 mi', value: 228 },
              duration: { text: '3 mins', value: 198 },
              end_location: { lat: 34.17788, lng: -118.777733 },
              html_instructions:
                'Head <b>southeast</b> on <b>Evanwood Ave</b> toward <b>Portsmouth Ct</b>',
              polyline: {
                points: '}oroEle~sUZkANg@J_@BEDOLSV_@Va@JMJWHSD[Ba@A]C]',
              },
              start_location: { lat: 34.1787112, lng: -118.7799076 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '180 ft', value: 55 },
              duration: { text: '1 min', value: 48 },
              end_location: { lat: 34.177392, lng: -118.777629 },
              html_instructions: 'Turn <b>right</b> onto <b>Nobletree Ct</b>',
              maneuver: 'turn-right',
              polyline: { points: 'wjroExw}sUZGh@GZC' },
              start_location: { lat: 34.17788, lng: -118.777733 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.2 mi', value: 349 },
              duration: { text: '5 mins', value: 304 },
              end_location: { lat: 34.1792366, lng: -118.7755292 },
              html_instructions: 'Turn <b>left</b> onto <b>Hawthorne Dr</b>',
              maneuver: 'turn-left',
              polyline: {
                points:
                  'ugroEdw}sUEc@G_@EOYoAu@gDQe@IQKOCESWAAUMICQGa@EWBG@YDG@_@F@JSHCB',
              },
              start_location: { lat: 34.177392, lng: -118.777629 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.4 mi', value: 601 },
              duration: { text: '9 mins', value: 520 },
              end_location: { lat: 34.182024, lng: -118.780476 },
              html_instructions: 'Continue onto <b>Churchwood Dr</b>',
              polyline: {
                points:
                  'gsroE`j}sUMFCEg@RC@[Po@\\OLs@d@y@t@MJMNYZUVw@dAq@hAOZc@bA_@bAERQd@Of@ABGZEZ?\\FnATzC',
              },
              start_location: { lat: 34.1792366, lng: -118.7755292 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '174 ft', value: 53 },
              duration: { text: '1 min', value: 37 },
              end_location: { lat: 34.1815555, lng: -118.7803609 },
              html_instructions:
                'Turn <b>left</b> onto <b>Kellwood Ct</b><div style="font-size:0.9em">Destination will be on the left</div>',
              maneuver: 'turn-left',
              polyline: { points: 'sdsoE~h~sU`@Ib@GTE' },
              start_location: { lat: 34.182024, lng: -118.780476 },
              travel_mode: 'WALKING',
            },
          ],
          traffic_speed_entry: [],
          via_waypoint: [],
        },
        {
          distance: { text: '39 ft', value: 12 },
          duration: { text: '1 min', value: 8 },
          end_address: '555 Kellwood Ct, Oak Park, CA 91377, USA',
          end_location: { lat: 34.1814532, lng: -118.7803137 },
          start_address: '566 Kellwood Ct, Oak Park, CA 91377, USA',
          start_location: { lat: 34.1815555, lng: -118.7803609 },
          steps: [
            {
              distance: { text: '39 ft', value: 12 },
              duration: { text: '1 min', value: 8 },
              end_location: { lat: 34.1814532, lng: -118.7803137 },
              html_instructions: 'Head <b>south</b> on <b>Kellwood Ct</b>',
              polyline: { points: 'wasoEfh~sUD?NI' },
              start_location: { lat: 34.1815555, lng: -118.7803609 },
              travel_mode: 'WALKING',
            },
          ],
          traffic_speed_entry: [],
          via_waypoint: [],
        },
        {
          distance: { text: '0.9 mi', value: 1449 },
          duration: { text: '21 mins', value: 1230 },
          end_address: '770 Admiral Ct, Oak Park, CA 91377, USA',
          end_location: { lat: 34.18676689999999, lng: -118.7825382 },
          start_address: '555 Kellwood Ct, Oak Park, CA 91377, USA',
          start_location: { lat: 34.1814532, lng: -118.7803137 },
          steps: [
            {
              distance: { text: '213 ft', value: 65 },
              duration: { text: '1 min', value: 62 },
              end_location: { lat: 34.182024, lng: -118.780476 },
              html_instructions:
                'Head <b>north</b> on <b>Kellwood Ct</b> toward <b>Churchwood Dr</b>',
              polyline: { points: 'aasoE|g~sUOH[Dc@Fa@H' },
              start_location: { lat: 34.1814532, lng: -118.7803137 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '243 ft', value: 74 },
              duration: { text: '1 min', value: 52 },
              end_location: { lat: 34.181867, lng: -118.781229 },
              html_instructions: 'Turn <b>left</b> onto <b>Churchwood Dr</b>',
              maneuver: 'turn-left',
              polyline: { points: 'sdsoE~h~sUBh@Dj@@L?P@HFLFF' },
              start_location: { lat: 34.182024, lng: -118.780476 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.2 mi', value: 267 },
              duration: { text: '3 mins', value: 190 },
              end_location: { lat: 34.179983, lng: -118.779575 },
              html_instructions:
                '<b>Churchwood Dr</b> turns <b>left</b> and becomes <b>Monteleone Ave</b>',
              polyline: {
                points: 'ucsoEtm~sUJBJARMbAc@b@S^U\\U`@_@d@i@T]\\m@j@cA',
              },
              start_location: { lat: 34.181867, lng: -118.781229 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '180 ft', value: 55 },
              duration: { text: '1 min', value: 40 },
              end_location: { lat: 34.1796233, lng: -118.7799054 },
              html_instructions: 'Turn <b>right</b> onto <b>Los Arcos Dr</b>',
              maneuver: 'turn-right',
              polyline: { points: '{wroEjc~sUZXZXNL' },
              start_location: { lat: 34.179983, lng: -118.779575 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.4 mi', value: 609 },
              duration: { text: '9 mins', value: 543 },
              end_location: { lat: 34.1841082, lng: -118.7834822 },
              html_instructions: 'Turn <b>right</b> onto <b>Kanan Rd</b>',
              maneuver: 'turn-right',
              polyline: {
                points:
                  'suroEle~sUq@hASZOTEFOPYZWVe@^EDSLc@ZMDGDQHUJSJSHe@P_@L_@JwBr@QFUHc@Tm@\\e@\\WRA?QRQNMNCFMLKNGHi@z@',
              },
              start_location: { lat: 34.1796233, lng: -118.7799054 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.2 mi', value: 304 },
              duration: { text: '5 mins', value: 271 },
              end_location: { lat: 34.186669, lng: -118.783135 },
              html_instructions:
                'Turn <b>right</b> onto <b>Golden Eagle Dr</b>',
              maneuver: 'turn-right',
              polyline: {
                points: 'uqsoEv{~sU_@]SMIEYKY@Q?UB_@FaB\\U@U?UAQCg@KgBa@',
              },
              start_location: { lat: 34.1841082, lng: -118.7834822 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '164 ft', value: 50 },
              duration: { text: '1 min', value: 46 },
              end_location: { lat: 34.18655, lng: -118.782609 },
              html_instructions:
                'Turn <b>right</b> onto <b>Golden Nugget Way</b>',
              maneuver: 'turn-right',
              polyline: { points: 'uatoEry~sUDUPsA' },
              start_location: { lat: 34.186669, lng: -118.783135 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '82 ft', value: 25 },
              duration: { text: '1 min', value: 26 },
              end_location: { lat: 34.18676689999999, lng: -118.7825382 },
              html_instructions:
                'Turn <b>left</b> onto <b>Admiral Ct</b><div style="font-size:0.9em">Destination will be on the right</div>',
              maneuver: 'turn-left',
              polyline: { points: '}`toEhv~sUa@KIA' },
              start_location: { lat: 34.18655, lng: -118.782609 },
              travel_mode: 'WALKING',
            },
          ],
          traffic_speed_entry: [],
          via_waypoint: [],
        },
        {
          distance: { text: '0.1 mi', value: 187 },
          duration: { text: '3 mins', value: 176 },
          end_address: '756 Sassafrass Way, Oak Park, CA 91377, USA',
          end_location: { lat: 34.1867798, lng: -118.781237 },
          start_address: '770 Admiral Ct, Oak Park, CA 91377, USA',
          start_location: { lat: 34.18676689999999, lng: -118.7825382 },
          steps: [
            {
              distance: { text: '82 ft', value: 25 },
              duration: { text: '1 min', value: 18 },
              end_location: { lat: 34.18655, lng: -118.782609 },
              html_instructions:
                'Head <b>south</b> on <b>Admiral Ct</b> toward <b>Golden Nugget Way</b>',
              polyline: { points: 'ibtoEzu~sUH@`@J' },
              start_location: { lat: 34.18676689999999, lng: -118.7825382 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '453 ft', value: 138 },
              duration: { text: '2 mins', value: 137 },
              end_location: { lat: 34.1865766, lng: -118.7811424 },
              html_instructions:
                'Turn <b>left</b> onto <b>Golden Nugget Way</b>',
              maneuver: 'turn-left',
              polyline: { points: '}`toEhv~sUJ{@Dk@@m@Ao@Go@Oo@' },
              start_location: { lat: 34.18655, lng: -118.782609 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '79 ft', value: 24 },
              duration: { text: '1 min', value: 21 },
              end_location: { lat: 34.1867798, lng: -118.781237 },
              html_instructions:
                'Turn <b>left</b> onto <b>Sassafrass Way</b><div style="font-size:0.9em">Destination will be on the left</div>',
              maneuver: 'turn-left',
              polyline: { points: 'catoEbm~sUa@NEB' },
              start_location: { lat: 34.1865766, lng: -118.7811424 },
              travel_mode: 'WALKING',
            },
          ],
          traffic_speed_entry: [],
          via_waypoint: [],
        },
        {
          distance: { text: '0.1 mi', value: 198 },
          duration: { text: '3 mins', value: 158 },
          end_address: '735 Covewood St, Oak Park, CA 91377, USA',
          end_location: { lat: 34.1853335, lng: -118.781344 },
          start_address: '756 Sassafrass Way, Oak Park, CA 91377, USA',
          start_location: { lat: 34.1867798, lng: -118.781237 },
          steps: [
            {
              distance: { text: '79 ft', value: 24 },
              duration: { text: '1 min', value: 19 },
              end_location: { lat: 34.1865766, lng: -118.7811424 },
              html_instructions:
                'Head <b>south</b> on <b>Sassafrass Way</b> toward <b>Golden Nugget Way</b>',
              polyline: { points: 'kbtoEvm~sUDC`@O' },
              start_location: { lat: 34.1867798, lng: -118.781237 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '151 ft', value: 46 },
              duration: { text: '1 min', value: 32 },
              end_location: { lat: 34.1864566, lng: -118.781618 },
              html_instructions:
                'Turn <b>right</b> onto <b>Golden Nugget Way</b>',
              maneuver: 'turn-right',
              polyline: { points: 'catoEbm~sUNn@Fn@' },
              start_location: { lat: 34.1865766, lng: -118.7811424 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '420 ft', value: 128 },
              duration: { text: '2 mins', value: 107 },
              end_location: { lat: 34.1853335, lng: -118.781344 },
              html_instructions:
                'Turn <b>left</b> onto <b>Covewood St</b><div style="font-size:0.9em">Destination will be on the right</div>',
              maneuver: 'turn-left',
              polyline: { points: 'k`toEbp~sUd@EXApAMXEFCPEZQ' },
              start_location: { lat: 34.1864566, lng: -118.781618 },
              travel_mode: 'WALKING',
            },
          ],
          traffic_speed_entry: [],
          via_waypoint: [],
        },
        {
          distance: { text: '0.1 mi', value: 229 },
          duration: { text: '3 mins', value: 202 },
          end_address: '5085 Benedict Ct, Oak Park, CA 91377, USA',
          end_location: { lat: 34.1846247, lng: -118.7800141 },
          start_address: '735 Covewood St, Oak Park, CA 91377, USA',
          start_location: { lat: 34.1853335, lng: -118.781344 },
          steps: [
            {
              distance: { text: '436 ft', value: 133 },
              duration: { text: '2 mins', value: 107 },
              end_location: { lat: 34.184202, lng: -118.780916 },
              html_instructions:
                'Head <b>southeast</b> on <b>Covewood St</b> toward <b>Durant Ct</b>',
              polyline: { points: 'iysoEjn~sUJGTITG`@Gh@ERCRIt@]' },
              start_location: { lat: 34.1853335, lng: -118.781344 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '315 ft', value: 96 },
              duration: { text: '2 mins', value: 95 },
              end_location: { lat: 34.1846247, lng: -118.7800141 },
              html_instructions:
                'Turn <b>left</b> onto <b>Benedict Ct</b><div style="font-size:0.9em">Destination will be on the left</div>',
              maneuver: 'turn-left',
              polyline: { points: 'grsoEvk~sUOg@EMWeAQ_@KOGI' },
              start_location: { lat: 34.184202, lng: -118.780916 },
              travel_mode: 'WALKING',
            },
          ],
          traffic_speed_entry: [],
          via_waypoint: [],
        },
        {
          distance: { text: '0.9 mi', value: 1465 },
          duration: { text: '19 mins', value: 1115 },
          end_address: '5169 Evanwood Ave, Oak Park, CA 91377, USA',
          end_location: { lat: 34.1789023, lng: -118.7804078 },
          start_address: '5085 Benedict Ct, Oak Park, CA 91377, USA',
          start_location: { lat: 34.1846247, lng: -118.7800141 },
          steps: [
            {
              distance: { text: '0.1 mi', value: 219 },
              duration: { text: '3 mins', value: 156 },
              end_location: { lat: 34.18364, lng: -118.782042 },
              html_instructions:
                'Head <b>southwest</b> on <b>Benedict Ct</b> toward <b>Covewood St</b>',
              polyline: {
                points: '{tsoE`f~sUFHJNP^VdADLNf@Pj@Lb@L\\Xf@R\\DDFFDP?J',
              },
              start_location: { lat: 34.1846247, lng: -118.7800141 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.1 mi', value: 176 },
              duration: { text: '2 mins', value: 126 },
              end_location: { lat: 34.184683, lng: -118.783178 },
              html_instructions:
                '<b>Benedict Ct</b> turns slightly <b>right</b> and becomes <b>Trousdale St</b>',
              polyline: {
                points: 'wnsoEvr~sU?DELMLe@p@YX_@PQDQB_@?MFGHCL@X?^',
              },
              start_location: { lat: 34.18364, lng: -118.782042 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '295 ft', value: 90 },
              duration: { text: '1 min', value: 76 },
              end_location: { lat: 34.1839577, lng: -118.7836651 },
              html_instructions: 'Turn <b>left</b> onto <b>Golden Eagle Dr</b>',
              maneuver: 'turn-left',
              polyline: { points: 'gusoEzy~sUXAXJHDRL^\\CHJHB@PN' },
              start_location: { lat: 34.184683, lng: -118.783178 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.1 mi', value: 224 },
              duration: { text: '3 mins', value: 175 },
              end_location: { lat: 34.1823312, lng: -118.7822648 },
              html_instructions: 'Turn <b>left</b> onto <b>Kanan Rd</b>',
              maneuver: 'turn-left',
              polyline: {
                points: 'wpsoE||~sUP]LUPUV]TWDENORQLITQXSLG^QDC^Oh@S',
              },
              start_location: { lat: 34.1839577, lng: -118.7836651 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.1 mi', value: 233 },
              duration: { text: '3 mins', value: 168 },
              end_location: { lat: 34.181481, lng: -118.784523 },
              html_instructions: 'Turn <b>right</b> onto <b>Bowfield St</b>',
              maneuver: 'turn-right',
              polyline: { points: 'qfsoEbt~sULv@RdADX^~ARr@Tp@N\\LXXl@' },
              start_location: { lat: 34.1823312, lng: -118.7822648 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.1 mi', value: 169 },
              duration: { text: '2 mins', value: 130 },
              end_location: { lat: 34.180244, lng: -118.783453 },
              html_instructions: 'Turn <b>left</b> onto <b>Hawthorne Dr</b>',
              maneuver: 'turn-left',
              polyline: { points: 'gasoEfb_tUvAkA~CiC' },
              start_location: { lat: 34.181481, lng: -118.784523 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '171 ft', value: 52 },
              duration: { text: '1 min', value: 46 },
              end_location: { lat: 34.180515, lng: -118.782998 },
              html_instructions: 'Turn <b>left</b> onto <b>Wiggin St</b>',
              maneuver: 'turn-left',
              polyline: { points: 'oyroEp{~sUw@yA' },
              start_location: { lat: 34.180244, lng: -118.783453 },
              travel_mode: 'WALKING',
            },
            {
              distance: { text: '0.2 mi', value: 302 },
              duration: { text: '4 mins', value: 238 },
              end_location: { lat: 34.1789023, lng: -118.7804078 },
              html_instructions:
                'Turn <b>right</b> onto <b>Evanwood Ave</b><div style="font-size:0.9em">Destination will be on the left</div>',
              maneuver: 'turn-right',
              polyline: {
                points: 'g{roEvx~sUh@e@d@e@`@g@d@q@f@_Af@iA^_A\\gANk@La@',
              },
              start_location: { lat: 34.180515, lng: -118.782998 },
              travel_mode: 'WALKING',
            },
          ],
          traffic_speed_entry: [],
          via_waypoint: [],
        },
      ],
      overview_polyline: {
        points:
          'cqroEph~sU|AwFHUd@s@b@o@Tk@H}@E{@dAOZCEc@Mo@oAwF[w@OUUY_@Qs@M_@Da@F_@F@JWLMFCEk@TkAn@cAr@gA`Ag@j@mA|AaAdBcAfCi@dBMv@?\\FnATzC`@Ix@MTIk@NeAPHtABh@NTV@zC{A~@u@z@gAhAqBv@r@NLq@hAc@p@gAlAcBnA}@`@mBt@_EpAqAr@}@p@s@r@e@n@i@z@_@]]SYKY@g@BaCd@k@@g@EoCm@ViBk@Mj@LPgB?}AW_Bg@Rf@SV~A~@GjBSXIf@Yj@QjAMf@Mt@]Og@]sA]o@GIFH\\n@\\rA|@tCl@dALLD\\ERs@~@YX_@Pc@H_@?MFKV@x@XAXJ\\R^\\CHNJPNP]^k@bAkApAaArAm@h@SLv@X~Ar@rCd@nAf@fAvFuEw@yAh@e@fAmAlAqBfAiCz@uC',
      },
      summary: 'Evanwood Ave',
      warnings: [
        'Walking directions are in beta. Use caution – This route may be missing sidewalks or pedestrian paths.',
      ],
      waypoint_order: [0, 2, 1, 4, 5, 3, 6],
    },
  ],
  status: 'OK',
};
*/
