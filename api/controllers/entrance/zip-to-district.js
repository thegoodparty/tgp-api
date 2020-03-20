/**
 * entrance/zip-to-district.js
 *
 * @description :: First step of account creation - search zip code to find district
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const senateThreshold = require('../../../data/senateThreshold');

module.exports = {
  friendlyName: 'Zip To District',

  description: 'Given a zip, returns zip with cd',

  inputs: {
    zip: {
      description: 'Zip Code',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Zip Error',
      responseType: 'badRequest',
    },
    notFound: {
      description: 'Zip Code Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { zip } = inputs;

      const zipCode = await ZipCode.findOne({ zip }).populate('cds');
      if (!zipCode) {
        return exits.notFound({
          message: 'Failed to find zip code',
          zipCode,
        });
      }
      const { stateShort } = zipCode;
      const senateThresholds = senateThreshold[stateShort];

      return exits.success({
        ...zipCode,
        senateThresholds,
      });
    } catch (err) {
      console.log('zip to district error');
      console.log(err);
      return exits.badRequest({ message: 'Zip code search failed' });
    }
  },
};
