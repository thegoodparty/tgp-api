const axios = require('axios');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

module.exports = {
  inputs: {
    electionType: {
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
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { electionType, state } = inputs;
      const searchValues = await querySearchColumn(electionType, state);
      return exits.success({ locations: searchValues });
    } catch (error) {
      console.log('error', error);
      return exits.badRequest('Error getting voter column values.');
    }
  },
};

async function querySearchColumn(searchColumn, electionState) {
  let searchValues = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/column/values/1OSR/VM_${electionState}/${searchColumn}?id=1OSR&apikey=${l2ApiKey}`;
    const response = await axios.get(searchUrl);
    if (response?.data?.values && response.data.values.length > 0) {
      searchValues = response.data.values;
    }
  } catch (e) {
    sails.helpers.log(slug, 'error at querySearchColumn', e);
  }
  return searchValues;
}
