/**
 * district/state
 *
 * @description :: returns data about one state.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Load State',

  description: 'Returns data about one state.',

  inputs: {
    shortState: {
      type: 'string',
      required: true,
      description: 'Long name of the state',
      example: 'California',
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
      const { shortState } = inputs;
      const state = await State.findOne({
        shortName: shortState.toLowerCase(),
      }).populate('congDistricts');
      let stateSupporters = 0;
      for (let i = 0; i < state.congDistricts.length; i++) {
        const district = state.congDistricts[i];
        const supportersCount = await User.count({ congDistrict: district.id });
        stateSupporters += supportersCount;
        state.congDistricts[i].supporters = supportersCount;
      }
      state.totalSupporters = stateSupporters;
      return exits.success({
        ...state,
      });
    } catch (err) {
      return exits.badRequest({
        message: 'Error getting state.',
      });
    }
  },
};
