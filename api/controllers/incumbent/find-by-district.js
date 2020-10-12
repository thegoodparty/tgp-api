/**
 * incumbents/find-by-id.js
 *
 * @description :: Find incumbents by open source id.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find Incumbent by id',

  description: 'Find incumbents by open source id',

  inputs: {
    state: {
      type: 'string',
    },
    district: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Incumbent Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Incumbent Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { state, district } = inputs;
      const { incumbent } = await sails.helpers.incumbentByDistrictHelper(
        state,
        district ? parseInt(district, 10) : district,
      );

      return exits.success({
        incumbent,
      });
    } catch (e) {
      await sails.helpers.errorLoggerHelper(
        'Error at incumbent/find-by-district',
        e,
      );
      console.log('Error in find by district', e);
      return exits.notFound();
    }
  },
};
