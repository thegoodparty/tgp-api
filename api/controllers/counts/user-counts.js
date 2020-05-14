/**
 * entrance/user-counts.js
 *
 * @description :: Count of users by division
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'User counts',

  description: 'Count of users by division',

  inputs: {
    districtNumber: {
      type: 'number',
      required: false,
    },
    shortState: {
      type: 'string',
      required: false,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Count Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { districtNumber, shortState } = inputs;
      const totalUsers = await User.count({
        presidentialRank: { nin: ['[]', ''] }, // nin = not in
      });
      let stateUsers;
      let districtUsers;
      if (shortState) {
        const lowerShortState = shortState.toLowerCase();
        stateUsers = await User.count({
          shortState: lowerShortState,
          senateRank: { '!=': '' },
        });
        if (districtNumber) {
          districtUsers = await User.count({
            shortState: lowerShortState,
            districtNumber,
            houseRank: { '!=': '' },
          });
        }
      }
      let threshold = 65853514; // presidential
      if (shortState) {
        const lowerShortState = shortState.toLowerCase();
        const state = await State.findOne({ shortName: lowerShortState });
        if (state) {
          threshold =
            Math.max(
              state.writeInThreshold,
              state.writeInThresholdWithPresident,
            ) + 1;
        }
        if (districtNumber) {
          const district = await CongDistrict.findOne({
            state: state.id,
            code: districtNumber,
          });
          if (district) {
            threshold =
              Math.max(
                district.writeInThreshold,
                district.writeInThresholdWithPresident,
              ) + 1;
          }
        }
      }

      return exits.success({
        totalUsers,
        stateUsers,
        districtUsers,
        threshold,
      });
    } catch (err) {
      console.log('error user counts');
      console.log(err);
      return exits.badRequest({ message: 'error user counts' });
    }
  },
};
