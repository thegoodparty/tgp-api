const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
// This does location discovery
const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

module.exports = {
  friendlyName: 'l2-data Location Helper',
  inputs: {},
  exits: {
    success: {
      description: 'OK',
    },
    badRequest: {
      description: 'Error',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const states = {
        AL: 'Alabama',
        AK: 'Alaska',
        AZ: 'Arizona',
        AR: 'Arkansas',
        CA: 'California',
        CO: 'Colorado',
        CT: 'Connecticut',
        DE: 'Delaware',
        DC: 'District Of Columbia',
        FL: 'Florida',
        FD: 'Federal',
        GA: 'Georgia',
        HI: 'Hawaii',
        ID: 'Idaho',
        IL: 'Illinois',
        IN: 'Indiana',
        IA: 'Iowa',
        KS: 'Kansas',
        KY: 'Kentucky',
        LA: 'Louisiana',
        ME: 'Maine',
        MD: 'Maryland',
        MA: 'Massachusetts',
        MI: 'Michigan',
        MN: 'Minnesota',
        MS: 'Mississippi',
        MO: 'Missouri',
        MT: 'Montana',
        NE: 'Nebraska',
        NV: 'Nevada',
        NH: 'New Hampshire',
        NJ: 'New Jersey',
        NM: 'New Mexico',
        NY: 'New York',
        NC: 'North Carolina',
        ND: 'North Dakota',
        OH: 'Ohio',
        OK: 'Oklahoma',
        OR: 'Oregon',
        PA: 'Pennsylvania',
        RI: 'Rhode Island',
        SC: 'South Carolina',
        SD: 'South Dakota',
        TN: 'Tennessee',
        TX: 'Texas',
        UT: 'Utah',
        VT: 'Vermont',
        VI: 'Virgin Islands',
        VA: 'Virginia',
        WA: 'Washington',
        WV: 'West Virginia',
        WI: 'Wisconsin',
        WY: 'Wyoming',
      };

      const statesList = Object.keys(states);
      const locationTypes = [
        'County',
        'City',
        'Town',
        'Township',
        'Village',
        'Hamlet',
      ];

      const filePath = path.join(__dirname, '../../../data/locations.csv');

      const headers = [
        { id: 'state', title: 'State' },
        { id: 'type', title: 'Type' },
        { id: 'name', title: 'name' },
        { id: 'value', title: 'value' },
      ];

      const csvWriter = createCsvWriter({
        path: filePath,
        header: headers,
      });

      let rows = [];
      for (const state of statesList) {
        for (const type of locationTypes) {
          const searchValues = await querySearchColumn(type, state);
          if (!searchValues || searchValues.length === 0) {
            continue;
          }
          for (const value of searchValues) {
            let name = formatName(value, state);
            if (name && value && name !== '') {
              rows.push({ state, type, name, value });
              console.log(`${state},${type},${name},${value}`);
            }
          }
          // sleep for 5 seconds
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      csvWriter
        .writeRecords(rows)
        .then(() => console.log('The CSV file was written successfully'));

      return exits.success(results);
    } catch (e) {
      console.log('error at location-helper', e);
      return exits.success('');
    }
  },
};

function formatName(value, state) {
  value = value.replace(state + '##', '');
  value = value.replace('TWP', 'Township');
  value = value.replace('TWN', 'Town');
  value = value.replace('(EST.)', '');
  value = value.trim();
  return value;
}

async function querySearchColumn(searchColumn, electionState) {
  let searchValues = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/column/values/1OSR/VM_${electionState}/${searchColumn}?id=1OSR&apikey=${l2ApiKey}`;
    console.log('searchUrl', searchUrl);
    const response = await axios.get(searchUrl);
    if (response?.data?.values && response.data.values.length > 0) {
      searchValues = response.data.values;
    }
  } catch (e) {
    console.log('error at querySearchColumn', e);
  }
  return searchValues;
}
