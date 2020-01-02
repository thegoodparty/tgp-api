/**
 * district/state
 *
 * @description :: returns data about one state.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const presidentialYear = true;

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
        // choose one threshold for each district
        const threshold = presidentialYear
          ? district.writeInThresholdWithPresident
          : district.writeInThreshold;
        district.threshold = threshold;
        delete district.writeInThreshold;
        delete district.writeInThresholdWithPresident;
      }
      // sort district by chance of winning
      state.congDistricts.sort((a, b) => {
        if (b.threshold === 0 || a.threshold === 0) {
          return 1;
        }
        return (
          (b.supporters * 100) / b.threshold -
          (a.supporters * 100) / a.threshold
        );
      });

      state.totalSupporters = stateSupporters;

      // choose one threshold for the state
      const threshold = presidentialYear
        ? state.writeInThresholdWithPresident
        : state.writeInThreshold;
      state.threshold = threshold;
      delete state.writeInThreshold;
      delete state.writeInThresholdWithPresident;

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
