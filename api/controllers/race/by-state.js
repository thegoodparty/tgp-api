const moment = require('moment');
module.exports = {
  inputs: {
    state: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 2,
    },
  },

  exits: {
    success: {
      description: 'found',
    },

    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const inputState = inputs.state;
      const state = inputState.toUpperCase();
      const counties = await County.find({
        where: { state },
        select: ['name', 'slug'],
      });

      const nextYear = moment()
        .startOf('year')
        .add(2, 'year')
        .format('M D, YYYY');

      const now = moment().format('M D, YYYY');

      const races = await BallotRace.find({
        where: {
          state,
          level: 'state',
          county: null,
          municipality: null,
          electionDate: { '<': new Date(nextYear), '>': new Date(now) },
        },
        select: ['hashId', 'positionSlug', 'data'],
      }).sort('electionDate ASC');

      const deduplicatedRaces = await sails.helpers.races.dedupRaces(
        races,
        state,
      );

      return exits.success({
        counties,
        races: deduplicatedRaces,
      });
    } catch (e) {
      console.log('error at races/by-state', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
