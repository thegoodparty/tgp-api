const axios = require('axios');
const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

// This helper builds an independent list of parties for each state.
// The resulting object is used in the voter-data-helper.
module.exports = {
  friendlyName: 'L2 Party Helper',

  inputs: {},
  exits: {
    success: {
      description: 'OK',
    },
  },

  fn: async function (inputs, exits) {
    let states = [
      'AL',
      'AK',
      'AZ',
      'AR',
      'CA',
      'CO',
      'CT',
      'DE',
      'DC',
      'FL',
      'GA',
      'HI',
      'ID',
      'IL',
      'IN',
      'IA',
      'KS',
      'KY',
      'LA',
      'ME',
      'MD',
      'MA',
      'MI',
      'MN',
      'MS',
      'MO',
      'MT',
      'NE',
      'NV',
      'NH',
      'NJ',
      'NM',
      'NY',
      'NC',
      'ND',
      'OH',
      'OK',
      'OR',
      'PA',
      'RI',
      'SC',
      'SD',
      'TN',
      'TX',
      'UT',
      'VT',
      'VA',
      'WA',
      'WV',
      'WI',
      'WY',
    ];
    let results = {};
    for (const state of states) {
      try {
        let parties = await getParties(state);
        console.log(`state: ${state}, parties: ${parties}`);
        results[state] = parties;
      } catch (e) {
        console.log('error at l2-parties', e);
      }
    }
    console.log('results', results);
    return exits.success(results);
  },
};

async function getParties(state) {
  let parties = [];
  try {
    const searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/column/values/1OSR/VM_${state}/Parties_Description?id=1OSR&apikey=${l2ApiKey}`;

    let partyResponse;
    console.log('searchUrl', searchUrl);
    partyResponse = await axios.get(searchUrl);
    // console.log('partyResponse', partyResponse);
    console.log('partyResponse.data.values', partyResponse.data.values);
    if (partyResponse?.data && partyResponse?.data?.values) {
      parties = partyResponse.data.values;
      console.log('parties', parties);
      parties = parties.filter(
        (value) => value !== 'Republican' && value !== 'Democratic',
      );
      console.log('parties (post filter)', parties);
    } else {
      await sails.helpers.slack.errorLoggerHelper(
        'unexpected response in l2-parties',
        partyResponse,
      );
    }
    return parties;
  } catch (e) {
    await sails.helpers.slack.errorLoggerHelper('error in l2-parties', e);
    return;
  }
}
