const moment = require('moment');

module.exports = {
  friendlyName: 'Health',

  description: 'root level health check',

  inputs: {
    zip: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Healthy',
    },

    badRequest: {
      description: 'Error getting root health route',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      await sails.helpers.queue.consumer();
      const { zip } = inputs;
      const today = moment().format('YYYY-MM-DD');
      const nextYear = moment().add(1, 'year').format('YYYY-MM-DD');
      const query = `
      query {
        races(
          location: {
            zip: "${zip}"
          }
          filterBy: {
            electionDay: {
              gt: "${today}"
              lt: "${nextYear}"
            }
          }
        ) {
          edges {
            node {
              election {
                id
                electionDay
                measures(
                  after: null
                  before: null
                  first: null
                  last: null
                ) {
                  edges {
                    node {
                      id
                      name
                      # Add other measure fields you want to retrieve
                    }
                  }
                }
                name
                originalElectionDate
                state
                timezone
              }
              position {  # Include the 'position' field here to get position data
                id
                appointed
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
                staggeredTerm
                state
                subAreaName
                subAreaValue
                tier
                updatedAt
                
              }
            }
          }
        }
      }
      
      `;

      const { races } = await sails.helpers.graphql.queryHelper(query);
      const groupedRaces = [];
      const existingPosition = {};
      // group races by level
      if (races?.edges) {
        for (let i = 0; i < races.edges.length; i++) {
          const edge = races.edges[i];

          const level = edge?.node?.position?.level;
          const id = edge?.node?.position?.id;
          if (existingPosition[id]) {
            continue;
          }
          existingPosition[id] = true;
          if (level === 'FEDERAL') {
            groupedRaces.push(edge.node);
          } else if (level === 'STATE') {
            groupedRaces.push(edge.node);
          } else {
            groupedRaces.push(edge.node);
          }
          const queueMessage = {
            type: 'saveBallotReadyRace',
            data: edge,
          };
          await sails.helpers.queue.enqueue(queueMessage);
        }
        // use queue to dave these to our db
      }

      return exits.success({
        races: groupedRaces,
      });
    } catch (e) {
      console.log('error at ballotData/get', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
