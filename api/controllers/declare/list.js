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
      // https://legacydocs.hubspot.com/docs/methods/forms/get-submissions-for-a-form
      const formId = 'f51c1352-c778-40a8-b589-b911c31e64b1';
      const url = `https://api.hubapi.com/form-integrations/v1/submissions/forms/${formId}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${hubSpotToken}`,
        },
      });

      let signaturesObj = {};
      let signatures = '';
      const data = response.data.results;
      if (data && data.length > 0) {
        for (const submission of data) {
          if (submission.values.length > 0) {
            let fn = submission.values[0].value;
            let ln = submission.values[1].value;
            // format the names to look nice and prevent duplicates.
            if (fn && fn.length >= 2) {
              fn =
                fn.charAt(0).toUpperCase() + fn.slice(1).toLowerCase().trim();
            }
            if (ln && ln.length >= 2) {
              ln =
                ln.charAt(0).toUpperCase() + ln.slice(1).toLowerCase().trim();
            }
            const name = `${fn} ${ln}`;
            if (!signaturesObj[name]) {
              signatures += `${name}, `;
              signaturesObj[name] = true;
            }
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
