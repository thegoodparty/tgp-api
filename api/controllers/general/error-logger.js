const axios = require('axios');

module.exports = {
  friendlyName: 'Health',

  description: 'root level health check',

  inputs: {
    message: {
      required: true,
      type: 'json',
    },
  },

  exits: {
    success: {
      description: 'Logged',
    },

    badRequest: {
      description: 'Error loggin error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { message } = inputs;
      await sails.helpers.slack.errorLoggerHelper(
        'Front End error log',
        message,
      );
      return exits.success({
        message: 'reported',
      });
    } catch (e) {
      console.log('error at health');
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error at error-logerh]', e);
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};
