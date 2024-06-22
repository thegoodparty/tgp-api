module.exports = {
  inputs: {
    candidacyId: {
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
    const { candidacyId } = inputs;
    let candidacy;
    try {
      // console.log('getting candidacy by candidacyId', candidacyId);
      candidacy = await getCandidacyById(candidacyId);
    } catch (error) {
      console.log('Error in getCandidacyById', error);
      return exits.success(false);
    }
    return exits.success(candidacy);
  },
};

async function getCandidacyById(candidacyId) {
  const query = `
query Node {
    node(id: "${candidacyId}") {
        ... on Candidacy {
            createdAt
            databaseId
            id
            isCertified
            isHidden
            result
            uncertified
            updatedAt
            withdrawn
            endorsements {
                createdAt
                databaseId
                endorser
                id
                recommendation
                status
                updatedAt
                organization {
                    color
                    createdAt
                    databaseId
                    description
                    id
                    logoUrl
                    name
                    state
                    updatedAt
                }
            }
            stances {
                databaseId
                id
                locale
                referenceUrl
                statement
                issue {
                    databaseId
                    id
                    name
                    pluginEnabled
                    responseType
                    rowOrder
                }
            }
        }
    }
}    
    `;
  const { node } = await sails.helpers.graphql.queryHelper(query);
  // console.log('node', node);
  return node;
}
