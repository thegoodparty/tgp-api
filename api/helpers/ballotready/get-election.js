module.exports = {
  inputs: {
    electionId: {
      type: 'string',
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const { electionId } = inputs;
    let election;
    try {
      console.log('getting election by electionId', electionId);
      election = await getElectionById(electionId);
    } catch (error) {
      console.log('Error in getElectionById', error);
      throw new Error({
        message: 'Error in getElectionById',
        error: JSON.stringify(error),
      });
    }
    return exits.success(election);
  },
};

async function getElectionById(electionId) {
  const query = `
  query Node {
    node(id: "${electionId}") {
        ... on Election {
            electionDay
            id
            name
            originalElectionDate
            raceCount
            slug
            state
            timezone
            updatedAt
            votingInformationPublishedAt
            databaseId
            ballotsSentOutBy
        }
    }
}
`;
  const { node } = await sails.helpers.graphql.queryHelper(query);
  console.log('node', node);
  return node;
}
