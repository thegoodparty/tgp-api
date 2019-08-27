const cdThreshold = require('../../../data/cdThreshold');
const senateThreshold = require('../../../data/senateThreshold');

module.exports = {
  friendlyName: 'Thresholds',

  description: 'Thresholds for CD and Senate',

  inputs: {},

  exits: {
    success: {
      description: 'Thresholds',
    },

    badRequest: {
      description: 'Error getting thresholds',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      return exits.success({
        cdThreshold,
        senateThreshold,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting threshold',
      });
    }
  },
};
