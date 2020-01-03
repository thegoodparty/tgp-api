/**
 * district/congDistrict
 *
 * @description :: returns data about one Congressional District.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const presidentialYear = true;

module.exports = {
  friendlyName: 'Congressional District',

  description: 'Returns data about one Congressional District',

  inputs: {
    ocdDivisionId: {
      type: 'string',
      required: true,
      description: 'Id of congressional district',
      example: 'ocd-division/country:us/state:ca/cd:34',
    },
  },

  exits: {
    success: {
      description: 'Able to load state',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error getting state',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { ocdDivisionId } = inputs;
      console.log(ocdDivisionId);
      const district = await CongDistrict.findOne({
        ocdDivisionId,
      });
      const supporters = await User.count({ congDistrict: district.id });
      // choose one threshold for each district
      const threshold = presidentialYear
        ? district.writeInThresholdWithPresident
        : district.writeInThreshold;
      district.threshold = threshold;
      delete district.writeInThreshold;
      delete district.writeInThresholdWithPresident;

      return exits.success({
        ...district,
        supporters,
      });
    } catch (err) {
      return exits.badRequest({
        message: 'Error getting district.',
      });
    }
  },
};
