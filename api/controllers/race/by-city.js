const slugify = require('slugify');

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
      if (!countyRecord | !municipalityRecord) {
        return exits.notFound();
      }

      const races = await BallotRace.find({
        state,
        county: null,
        municipality: municipalityRecord.id,
      });
      races.forEach((race) => {
        const { data } = race;
        const {
          election_name,
          election_day,
          position_name,
          position_description,
          level,
        } = data;
        race.electionName = election_name;
        race.date = election_day;
        race.positionName = position_name;
        race.positionDescription = position_description;
        race.level = level;
        delete race.data;
      });
      return exits.success({
        races,
        municipality: municipalityRecord.data,
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
