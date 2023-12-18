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
