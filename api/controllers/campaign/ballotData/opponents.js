module.exports = {
  friendlyName: 'Opponents',

  description: 'get opponents by electionId',

  inputs: {
    electionId: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'OK',
    },

    badRequest: {
      description: 'Error getting opponents',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { electionId } = inputs;
      // todo: see if this can be reworked to pull
      // candidates from a positionId instead of electionId
      const query = `
      query {
        races(
            filterBy: { electionId: "${electionId}" }
        ) {
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
                candidacies {
                    createdAt
                    databaseId
                    id
                    isCertified
                    isHidden
                    result
                    uncertified
                    updatedAt
                    withdrawn
                    candidate {
                        createdAt
                        email
                        firstName
                        fullName
                        id
                        lastName
                        middleName
                        nickname
                        phone
                        suffix
                        updatedAt
                        urls {
                            type
                            url
                        }
                        images {
                            type
                            url
                        }
                        experiences {
                            databaseId
                            end
                            id
                            organization
                            start
                            title
                            type
                        }
                        degrees {
                            databaseId
                            degree
                            gradYear
                            id
                            major
                            school
                        }
                        headshot {
                            defaultUrl
                            thumbnailUrl
                        }
                    }
                }
            }
        }
    }
      `;

      const { races } = await sails.helpers.graphql.queryHelper(query);

      let opponents = [];
      if (races?.nodes && races.nodes.length > 0) {
        opponents = races?.nodes[0].candidacies || [];
      }

      return exits.success({
        opponents,
      });
    } catch (e) {
      console.log('error at ballotData/opponents');
      console.log(e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
