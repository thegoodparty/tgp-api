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

  inputs: {},

  exits: {
    success: {
      description: 'All Divisions',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error getting divisions',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let houseDivisions = await CongDistrict.find().sort([{ id: 'ASC' }]);
      houseDivisions = houseDivisions.map(division => ({ ...division, isSenate: false}));
      let senateDivisions = await SenateDistrict.find().sort([{ id: 'ASC' }]);
      senateDivisions = senateDivisions.map(division => ({ ...division, isSenate: true}));
      return exits.success({
        divisions: houseDivisions.concat(senateDivisions)
      });
    } catch (err) {
      return exits.badRequest({
        message: 'Error getting divisions.',
      });
    }
  },
};
