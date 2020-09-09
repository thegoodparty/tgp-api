/**
 * district/congDistrict
 *
 * @description :: returns data about one Congressional District.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const presidentialYear = true;

module.exports = {
  friendlyName: 'All Divisions',

  description: 'Get All Divisions from CongDistrict and SenateDistrict',

  inputs: {
    updatedDivision: {
      type: 'json',
      required: true,
      description: "Updated Division",
    },
  },

  exits: {
    success: {
      description: 'Edit Division',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error editing division',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let { updatedDivision } = inputs;
      const { id, isSenate } = updatedDivision;
      delete updatedDivision[id];
      delete updatedDivision[isSenate];
      let division;
      if(isSenate) {
        division = await SenateDistrict.updateOne({
          id,
        }).set(updatedDivision);
      } else {
        division = await CongDistrict.updateOne({
          id,
        }).set(updatedDivision);
      }
      division = { ...division, isSenate };
      return exits.success({
        division
      });
    } catch (err) {
      return exits.badRequest({
        message: 'Error editing division',
      });
    }
  },
};
