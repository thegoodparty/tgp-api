const axios = require('axios');

module.exports = {
  friendlyName: 'l2-data API Helper',

  inputs: {
    electionTerm: {
      type: 'number',
      required: true,
    },
    electionYear: {
      type: 'number',
      required: true,
    },
    // should be 2 digit state abbreviation ie: NC, CA, TN, etc.
    electionState: {
      type: 'string',
      required: true,
    },
    electionType: {
      type: 'string',
      required: true,
    },
    electionLocation: {
      type: 'string',
      required: true,
    },
    electionDistrict: {
      type: 'string',
    },
  },

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
      const {
        electionTerm,
        electionYear,
        electionState,
        electionType,
        electionLocation,
        electionDistrict,
      } = inputs;

      const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

      let searchUrl = `https://api.l2datamapping.com/api/v2/records/search/1OSR/VM_${electionState}?id=1OSR&apikey=${l2ApiKey}`;

      let countsJson = {
        format: 'counts',
        filters: {},
        columns: ['Parties_Description'],
      };

      countsJson['filters'][electionType] = electionLocation;
      if (electionDistrict) {
        // const electionDistrictType = getElectionDistrictType(electionType);
        const electionDistrictType = 'City_Ward';
        countsJson['filters'][electionDistrictType] = electionDistrict;
        // countsJson['filters'][electionDistrict] = 1;
      }

      const response = await axios.post(searchUrl, countsJson);

      console.log('response', response.data);
      let counts = {
        Total: 0,
        Democratic: 0,
        Republican: 0,
        Independent: 0,
      };
      for (const item of response.data) {
        counts['Total'] += item['__COUNT'];
        if (item['Parties_Description'] === 'Democratic') {
          counts['Democratic'] += item['__COUNT'];
        } else if (item['Parties_Description'] === 'Republican') {
          counts['Republican'] += item['__COUNT'];
        } else {
          counts['Independent'] += item['__COUNT'];
        }
      }

      console.log('counts', counts);

      return exits.success(counts);
    } catch (e) {
      console.log('error at count-helper', e);
      return exits.success('');
    }
  },
};
