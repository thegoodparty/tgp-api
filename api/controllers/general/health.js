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
      try {
        await axios.get('https://goodparty.org');
      } catch (error) {
        console.log('axios can not get')
        await sails.helpers.errorLoggerHelper('SITE IS DOWN!', error);
      }
      return exits.success({
        health: 'Welcome to Good Party Api',
      });
    } catch (e) {
      console.log('error at health');
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at api health', e);
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};
