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
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { raceId } = inputs;
    let race;
    try {
      console.log('getting race by raceId', raceId);
      race = await getRaceById(raceId);
    } catch (error) {
      console.log('Error in getRaceById', error);
      return exits.badRequest({
        message: 'Error in getRaceById',
        error: JSON.stringify(error),
      });
    }
    return exits.success(race);
  },
};

async function getRaceById(raceId) {
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
                    description
                    judicial
                    level
                    name
                    partisanType
                    staggeredTerm
                    state
                    subAreaName
                    subAreaValue
                    tier
                    electionFrequencies {
                        frequency
                    }
                    hasPrimary
                    normalizedPosition {
                      name
                  }
                }
                filingPeriods {
                    endOn
                    startOn
                }
            }
        }
    }
    `;
  const { node } = await sails.helpers.graphql.queryHelper(query);
  console.log('node', node);
  return node;
}
