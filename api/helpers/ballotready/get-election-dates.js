/* eslint-disable object-shorthand */

module.exports = {
  inputs: {
    // can be candidate slug or campaign slug.
    slug: {
      type: 'string',
      required: true,
    },
    officeName: {
      type: 'string',
      required: true,
    },
    zip: {
      type: 'string',
      required: true,
    },
    // note: level is ballotLevel (not level -- level is the simplified lowercase one)
    level: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { slug, officeName, zip, level } = inputs;
    try {
      let electionDates = [];

      // get todays date in format YYYY-MM-DD
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const dateToday = `${year}-${month}-${day}`;

      const query = `
        query {
            races(
                location: { zip: "${zip}" }
                filterBy: { electionDay: { gt: "2006-01-01", lt: "${dateToday}" }, level: ${level} }
            ) {
                edges {
                    node {
                        position {    
                            name
                        }
                        election {
                            electionDay
                        }
                    }
                }
            }
        }`;

      const { races } = await sails.helpers.graphql.queryHelper(query);
      sails.helpers.log(slug, 'getElectionDates graphql result', races);
      const results = races?.edges || [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const { position, election } = result.node;
        if (position?.name && election?.electionDay) {
          if (position.name.toLowerCase() === officeName.toLowerCase()) {
            if (!electionDates.includes(election.electionDay)) {
              electionDates.push(election.electionDay);
            }
          }
        }
      }
      sails.helpers.log(slug, 'electionDates', electionDates);

      return exits.success(electionDates);
    } catch (e) {
      sails.helpers.log(slug, 'error at extract-location-ai helper', e);
      return exits.success(false);
    }
  },
};
