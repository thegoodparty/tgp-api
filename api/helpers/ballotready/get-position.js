module.exports = {
  inputs: {
    positionId: {
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
    const { positionId } = inputs;
    let position;
    try {
      console.log('getting position by positionId', positionId);
      position = await getPositionById(positionId);
    } catch (error) {
      console.log('Error in getPositionById', error);
      return exits.badRequest({
        message: 'Error in getPositionById',
        error: JSON.stringify(error),
      });
    }
    return exits.success(position);
  },
};

async function getPositionById(positionId) {
  const query = `
  query Node {
    node(id: "${positionId}") {
        ... on Position {
            appointed
            createdAt
            databaseId
            description
            eligibilityRequirements
            employmentType
            filingAddress
            filingPhone
            filingRequirements
            geoId
            hasMajorityVotePrimary
            hasPrimary
            hasRankedChoiceGeneral
            hasRankedChoicePrimary
            hasUnknownBoundaries
            id
            judicial
            level
            maximumFilingFee
            minimumAge
            mtfcc
            mustBeRegisteredVoter
            mustBeResident
            mustHaveProfessionalExperience
            name
            paperworkInstructions
            partisanType
            rankedChoiceMaxVotesGeneral
            rankedChoiceMaxVotesPrimary
            retention
            rowOrder
            runningMateStyle
            salary
            seats
            selectionsAllowed
            slug
            staggeredTerm
            state
            subAreaName
            subAreaValue
            tier
            updatedAt
            electionFrequencies {
                databaseId
                frequency
                id
                referenceYear
                seats
                validFrom
                validTo
            }
        }
    }
  }
  `;
  const { node } = await sails.helpers.graphql.queryHelper(query);
  console.log('node', node);
  return node;
}
