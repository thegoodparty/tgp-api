const slugify = require('slugify');

module.exports = {
  inputs: {
    county_name: {
      type: 'string',
    },
    state_id: {
      type: 'string',
    },
    row: {
      type: 'json',
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
    const { county_name, state_id, row } = inputs;

    const slug = `${slugify(state_id, {
      lower: true,
    })}/${slugify(county_name, {
      lower: true,
    })}`;

    console.log(
      `adding county: ${county_name}, state: ${state_id}. slug: ${slug}`,
    );

    let county;
    try {
      county = await County.create({
        name: county_name,
        state: state_id,
        slug,
        data: row,
      }).fetch();
    } catch (e) {
      console.log('error in addCounty', e);
    }
    if (county && row?.aiExtracted) {
      // await sails.helpers.slack.errorLoggerHelper(
      //   `added ai extracted county: ${county_name}, state: ${state_id}`,
      //   {},
      // );
    }
    return exits.success(county);
  },
};
