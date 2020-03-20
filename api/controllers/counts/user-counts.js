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

      const totalUsers = await User.count();
      let stateUsers;
      let districtUsers;
      if (shortState) {
        stateUsers = await User.count({ shortState });
        if (districtNumber) {
          districtUsers = await User.count({
            shortState,
            districtNumber,
          });
        }
      }
      // const totalUsers = await User.count({ senateDistrict: senats[i].id });

      return exits.success({
        totalUsers,
        stateUsers,
        districtUsers,
      });
    } catch (err) {
      console.log('zip to district error');
      console.log(err);
      return exits.badRequest({ message: 'Zip code search failed' });
    }
  },
};
