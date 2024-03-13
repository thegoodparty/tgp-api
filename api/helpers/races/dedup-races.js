/* eslint-disable object-shorthand */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    races: {
      type: 'json',
    },
    state: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 2,
    },
    county: {
      type: 'string',
    },
    city: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { races, state, county, city } = inputs;
      const uniqueRaces = new Map();

      races.forEach((race) => {
        if (!uniqueRaces.has(race.positionSlug)) {
          const { data, positionSlug } = race;
          const {
            election_name,
            election_day,
            normalized_position_name,
            position_description,
            level,
          } = data;
          race.electionName = election_name;
          race.date = election_day;
          race.normalizedPositionName = normalized_position_name;
          race.positionDescription = position_description;
          race.level = level;
          race.positionSlug = positionSlug;
          race.state = state;
          race.county = county;
          race.city = city;
          delete race.data;
          uniqueRaces.set(race.positionSlug, race);
        }
      });
      // Convert the Map values back to an array for the final deduplicated list
      const deduplicatedRaces = Array.from(uniqueRaces.values());

      return exits.success(deduplicatedRaces);
    } catch (e) {
      console.log('error at dedup-races', e);
      return exits.success(input.races);
    }
  },
};
