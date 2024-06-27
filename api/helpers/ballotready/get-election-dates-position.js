// get election dates by position id.

module.exports = {
  inputs: {
    // can be candidate slug or campaign slug.
    slug: {
      type: 'string',
      required: true,
    },
    positionId: {
      type: 'string', // should be the hashId of the position
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
    try {
      const { slug, positionId } = inputs;

      let electionDates = [];

      // get todays date in format YYYY-MM-DD
      const today = new Date();
      const year = today.getFullYear();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const dateToday = `${year}-${month}-${day}`;

      const query = `
      query Node {
        node(id: "${positionId}") {
            ... on Position {
                races(filterBy: { electionDay: { lt: "${dateToday}" } }) {
                    nodes {
                        createdAt
                        databaseId
                        id
                        isDisabled
                        isPartisan
                        isPrimary
                        isRecall
                        isRunoff
                        isUnexpired
                        seats
                        updatedAt
                        election {
                            electionDay
                        }
                    }
                }
            }
        }
    }`;

      const { node } = await sails.helpers.graphql.queryHelper(query);
      // sails.helpers.log(slug, 'getElectionDates graphql result', JSON.stringify(node, null, 2));
      const results = node.races?.nodes || [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const { election } = result;
        if (!electionDates.includes(election.electionDay)) {
          electionDates.push(election.electionDay);
        }
      }
      sails.helpers.log(slug, 'electionDates', electionDates);

      return exits.success(electionDates);
    } catch (e) {
      console.log('error at get-election-dates-position helper', e);
      return exits.success(false);
    }
  },
};
