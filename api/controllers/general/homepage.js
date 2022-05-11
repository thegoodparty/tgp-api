const axios = require('axios');

module.exports = {
  friendlyName: 'Health',

  description: 'root level health check',

  inputs: {},

  exits: {
    success: {
      description: 'Healthy',
    },

    badRequest: {
      description: 'Error getting root health route',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const formId = '39b42d7f-826d-435d-a41f-bd692ee1298e';
      const count = await sails.helpers.crm.formSubmissions(formId);

      console.log('count', count)

      return exits.success({
        formSubmissions: count && count.results? count.results.length : 0,
      });
    } catch (e) {
      console.log('error at health');
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at api health', e);
      return exits.success({
        formSubmissions: 0,
      });
    }
  },
};
