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
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { level } = inputs;
      // this helper just simplifies level to city/state/county/federal.
      // it is used in extractLocationAi.
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
      console.log('error at encrypt-id', e);
      return exits.success(false);
    }
  },
};