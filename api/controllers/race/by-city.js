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
    city: {
      type: 'string',
      required: true,
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
      const { county, city } = inputs;
      const inputState = inputs.state;
      const countySlug = `${slugify(inputState, { lower: true })}/${slugify(
        county,
        {
          lower: true,
        },
      )}`;
      const slug = `${slugify(inputState, { lower: true })}/${slugify(county, {
        lower: true,
      })}/${slugify(city, {
        lower: true,
      })}`;
      const state = inputState.toUpperCase();

      const countyRecord = await County.findOne({
        slug: countySlug,
      });
      const municipalityRecord = await Municipality.findOne({
        slug,
      });
      if (!countyRecord || !municipalityRecord) {
        return exits.notFound();
      }

      const nextYear = moment()
        .startOf('year')
        .add(1, 'year')
        .format('M D, YYYY');

      const races = await BallotRace.find({
        where: {
          state,
          county: null,
          municipality: municipalityRecord.id,
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

      const {
        population,
        density,
        income_household_median,
        unemployment_rate,
        home_value,
        county_name,
      } = municipalityRecord.data;

      const shortCity = {
        population,
        density,
        income_household_median,
        unemployment_rate,
        home_value,
        county_name,
        city: municipalityRecord.data.city,
      };

      return exits.success({
        races: deduplicatedRaces,
        municipality: shortCity,
      });
    } catch (e) {
      console.log('error at races/by-city', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
