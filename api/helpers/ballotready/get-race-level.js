module.exports = {
  inputs: {
    level: {
      type: 'string',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let { level } = inputs;
      // this helper just simplifies level to city/state/county/federal.
      // it is used in p2v.
      // from this larger list:
      // "level"
      // "city"
      // "county"
      // "federal"
      // "local"
      // "regional"
      // "state"
      // "town"
      // "township"
      // "village"
      level = level.toLowerCase();
      if (
        level &&
        level !== 'federal' &&
        level !== 'state' &&
        level !== 'county' &&
        level !== 'city'
      ) {
        level = 'city';
      }
      return exits.success(level);
    } catch (e) {
      console.log('error at get-race-level', e);
      return exits.success(level);
    }
  },
};
