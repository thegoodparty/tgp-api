const slugify = require('slugify');
const moment = require('moment');

module.exports = {
  inputs: {
    state: {
      type: 'string',
      required: true,
      minLength: 2,
      maxLength: 2,
    },
    county: {
      type: 'string',
      required: true,
    },
    viewAll: {
      type: 'boolean',
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

    notFound: {
      description: 'Not Found',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { county, viewAll } = inputs;
      const inputState = inputs.state;
      const slug = `${slugify(inputState, { lower: true })}/${slugify(county, {
        lower: true,
      })}`;
      const state = inputState.toUpperCase();
      const countyRecord = await County.findOne({
        slug,
      });
      if (!countyRecord) {
        return exits.notFound();
      }
      const municipalities = await Municipality.find({
        where: { state, county: countyRecord.id },
        select: ['name', 'slug'],
      });

      const nextYear = moment()
        .startOf('year')
        .add(1, 'year')
        .format('M D, YYYY');

      const races = await BallotRace.find({
        where: {
          state,
          level: 'county',
          county: countyRecord.id,
          municipality: null,
          electionDate: { '<': new Date(nextYear) },
        },
        select: ['hashId', 'positionSlug', 'data'],
        limit: viewAll ? undefined : 10,
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
            position_description,
            normalized_position_name,
            level,
          } = data;
          race.electionName = election_name;
          race.date = election_day;
          race.positionName = position_name;
          race.normalizedPositionName = normalized_position_name;
          race.positionDescription = position_description;
          race.level = level;
          race.positionSlug = positionSlug;
          race.state = state;
          race.county = county;
          delete race.data;
          uniqueRaces.set(race.positionSlug, race);
        }
      });

      // Convert the Map values back to an array for the final deduplicated list
      const deduplicatedRaces = Array.from(uniqueRaces.values());

      const {
        county_full,
        city_largest,
        population,
        density,
        income_household_median,
        unemployment_rate,
        home_value,
      } = countyRecord.data;

      const shortCounty = {
        county: countyRecord.data.county,
        county_full,
        city_largest,
        population,
        density,
        income_household_median,
        unemployment_rate,
        home_value,
      };

      return exits.success({
        municipalities,
        races: deduplicatedRaces,
        county: shortCounty,
      });
    } catch (e) {
      console.log('error at races/by-county', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
