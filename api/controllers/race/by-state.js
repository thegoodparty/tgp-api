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
        .add(1, 'year')
        .format('M D, YYYY');

      const races = await BallotRace.find({
        where: {
          state,
          level: 'state',
          county: null,
          municipality: null,
          electionDate: { '<': new Date(nextYear) },
        },
        select: ['hashId', 'positionSlug', 'data'],
      }).sort('electionDate ASC');

      // Deduplicate based on positionSlug
      const uniqueRaces = new Map();

      races.forEach((race) => {
        if (!uniqueRaces.has(race.positionSlug)) {
          const { data, positionSlug } = race;
          const {
            election_name,
            election_day,
            position_name,
            normalized_position_name,
            position_description,
            level,
            state,
          } = data;
          race.electionName = election_name;
          race.date = election_day;
          race.positionName = position_name;
          race.normalizedPositionName = normalized_position_name;
          race.positionDescription = position_description;
          race.level = level;
          race.positionSlug = positionSlug;
          race.state = state;
          delete race.data;
          uniqueRaces.set(race.positionSlug, race);
        }
      });
      // Convert the Map values back to an array for the final deduplicated list
      const deduplicatedRaces = Array.from(uniqueRaces.values());

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
