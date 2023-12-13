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
        where: { state, county: county.id },
        select: ['name', 'slug'],
      });
      const races = await BallotRace.find({
        state,
        level: 'county',
        county: countyRecord.id,
        municipality: null,
      });
      return exits.success({
        municipalities,
        races,
        county: countyRecord.data,
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
