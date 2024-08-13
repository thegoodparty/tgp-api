module.exports = {
  inputs: {
    candidateId: {
      type: 'string',
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const { candidateId } = inputs;
    let candidate;
    try {
      console.log('getting candidate by candidateId', candidateId);
      candidate = await getCandidateById(candidateId);
    } catch (error) {
      console.log('Error in getCandidateById', error);
      throw new Error({
        message: 'Error in getCandidateById',
        error: JSON.stringify(error),
      });
    }
    return exits.success(candidate);
  },
};

async function getCandidateById(candidateId) {
  const query = `
  query Node {
    node(id: "${candidateId}") {
        ... on Person {
            createdAt
            databaseId
            email
            firstName
            fullName
            id
            lastName
            middleName
            nickname
            phone
            slug
            suffix
            updatedAt
            headshot {
                defaultUrl
                thumbnailUrl
            }
            images {
                type
                url
            }
            urls {
                databaseId
                id
                type
                url
            }
        }
    }
  }
  `;
  const { node } = await sails.helpers.graphql.queryHelper(query);
  console.log('node', node);
  return node;
}
