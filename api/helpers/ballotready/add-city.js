const slugify = require('slugify');

module.exports = {
  inputs: {
    row: {
      type: 'json',
    },
    city: {
      type: 'string',
    },
    countyId: {
      type: 'string',
    },
    state_id: {
      type: 'string',
    },
    county_name: {
      type: 'string',
    },
    type: {
      type: 'string',
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { row, city, countyId, state_id, county_name, type } = inputs;

    const slug = `${slugify(state_id, {
      lower: true,
    })}/${slugify(county_name, {
      lower: true,
    })}/${slugify(city, {
      lower: true,
    })}`;

    console.log(
      `adding city: ${city}, county: ${county_name}, state: ${state_id}. slug: ${slug}`,
    );

    const exists = await Municipality.findOne({
      type,
      slug,
    });
    let municipality;
    if (!exists) {
      try {
        municipality = await Municipality.create({
          name: city,
          type,
          state: state_id,
          county: countyId,
          data: row,
          slug,
        }).fetch();
      } catch (e) {
        console.log('error in addCity', e);
      }
    }
    if (municipality && row?.aiExtracted) {
      await sails.helpers.slack.errorLoggerHelper(
        `added ai extracted city: ${city}, state: ${state_id}`,
        {},
      );
    }
    return exits.success(municipality);
  },
};
