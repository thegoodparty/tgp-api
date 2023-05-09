const axios = require('axios');
// const hubspot = require('@hubspot/api-client');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

module.exports = {
  friendlyName: 'Declarations',

  description: 'Signatures of declarations page',

  inputs: {},

  exits: {
    success: {
      description: 'First Name Last Name, First Name Last Name, ...',
    },

    badRequest: {
      description: 'Error getting root health route',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      // @hubspot/api-client does not appear to support the formaApi anymore.
      // so we make the request using axios.
      const formId = 'f51c1352-c778-40a8-b589-b911c31e64b1';
      const url = `https://api.hubapi.com/form-integrations/v1/submissions/forms/${formId}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${hubSpotToken}`,
        },
      });

      let signatures = '';
      const data = response.data.results;
      if (data && data.length > 0) {
        for (const submission of data) {
          if (submission.values.length > 0) {
            signatures += `${submission.values[0].value} ${submission.values[1].value}, `;
          }
        }
      }
      if (signatures.length > 2) {
        signatures = signatures.slice(0, -2);
      }

      return exits.success({
        signatures,
      });
    } catch (e) {
      console.log('error at declare list');
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at declare list', e);
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};
