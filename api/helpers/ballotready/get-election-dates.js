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
      minLength: 5,
      maxLength: 5,
    },
    // note: this must be ballotLevel the upper case version of the level. ie: "CITY" not "city"
    level: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
    },
  },

  fn: async function (inputs, exits) {
    const { slug, officeName, zip, level } = inputs;
    try {
      let electionDates = [];
      let startCursor;
      let query = getElectionDateQuery(zip, level, startCursor);

      const { races } = await sails.helpers.graphql.queryHelper(query);
      // sails.helpers.log(slug, 'getElectionDates graphql result', races);

      hasNextPage = races.pageInfo.hasNextPage;
      startCursor = races.pageInfo.endCursor;
      let results = races?.edges || [];
      electionDates = parseElectionDates(results, officeName, electionDates);

      while (hasNextPage === true) {
        query = getElectionDateQuery(zip, level, startCursor);
        const queryResponse = await sails.helpers.graphql.queryHelper(query);
        results = queryResponse.races?.edges || [];
        electionDates = parseElectionDates(results, officeName, electionDates);
        hasNextPage = queryResponse?.pageInfo?.hasNextPage || false;
        startCursor = queryResponse?.pageInfo?.endCursor;
      }

      sails.helpers.log(slug, 'electionDates', electionDates);

      return exits.success(electionDates);
    } catch (e) {
      sails.helpers.log(slug, 'error at get-election-dates helper', e);
      return exits.success(false);
    }
  },
};

function parseElectionDates(results, officeName, electionDates) {
  // get all the non-primary election dates for a race.
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const { position, election, isPrimary } = result.node;
    if (position?.name && election?.electionDay && !isPrimary) {
      if (position.name.toLowerCase() === officeName.toLowerCase()) {
        if (!electionDates.includes(election.electionDay)) {
          electionDates.push(election.electionDay);
        }
      }
    }
  }

  return electionDates;
}

function getElectionDateQuery(zip, level, startCursor) {
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
          after: ${startCursor ? `"${startCursor}"` : null}
      ) {
          edges {
              node {
                  position {    
                      name
                  }
                  election {
                      electionDay
                  }
                  isPrimary
              }
          }
          pageInfo {
            endCursor
            hasNextPage
            hasPreviousPage
            startCursor
          }              
      }
  }`;
  return query;
}
