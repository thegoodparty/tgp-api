module.exports = {
  inputs: {
    raceId: {
      type: 'string',
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const { raceId } = inputs;
    let race;
    try {
      console.log('getting race by raceId', raceId);
      race = await getRaceData(raceId);
    } catch (error) {
      console.log('Error in getRaceData', error);
      throw new Error({
        message: 'Error in getRaceData',
        error: JSON.stringify(error),
      });
    }
    return exits.success(race);
  },
};

// race data includes candidacies and office holders
async function getRaceData(raceId) {
  const query = `
        query Node {
          node(id: "${raceId}") {
              ... on Race {
                  databaseId
                  isPartisan
                  isPrimary
                  election {
                      electionDay
                      name
                      state
                  }
                  position {
                      id
                      description
                      judicial
                      level
                      name
                      partisanType
                      staggeredTerm
                      state
                      seats
                      subAreaName
                      subAreaValue
                      tier
                      mtfcc
                      geoId
                      electionFrequencies {
                          frequency
                      }
                      hasPrimary
                      normalizedPosition {
                        name
                    }                  
                    officeHolders {
                        nodes {
                            centralPhone
                            createdAt
                            databaseId
                            endAt
                            id
                            isAppointed
                            isCurrent
                            isOffCycle
                            isVacant
                            officePhone
                            officeTitle
                            otherPhone
                            primaryEmail
                            specificity
                            startAt
                            totalYearsInOffice
                            updatedAt
                            person {
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
                            }
                        }
                     }
                  }                  
                  filingPeriods {
                      endOn
                      startOn
                  }
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
                    }
                    election { 
                        electionDay
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
