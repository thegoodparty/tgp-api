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
      const { county } = inputs;
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

      const now = moment().format('M D, YYYY');

      const races = await BallotRace.find({
        where: {
          state,
          level: 'county',
          county: countyRecord.id,
          municipality: null,
          electionDate: { '<': new Date(nextYear), '>': new Date(now) },
        },
        select: ['hashId', 'positionSlug', 'data'],
      }).sort('electionDate ASC');

      // Deduplicate based on positionSlug
      const deduplicatedRaces = await sails.helpers.races.dedupRaces(
        races,
        state,
        county,
      );

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
