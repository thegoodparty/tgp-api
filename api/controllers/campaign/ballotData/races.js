// https://developers.civicengine.com/docs/api/graphql

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
              id
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
                level
                name
                salary
                state
                subAreaName
                subAreaValue
                electionFrequencies {
                  frequency
                }
              }
            }
          }
        }
      }
      
      `;

      const { races } = await sails.helpers.graphql.queryHelper(query);
      const cleanRaces = [];
      const existingPosition = {};
      // group races by level
      if (races?.edges) {
        for (let i = 0; i < races.edges.length; i++) {
          const edge = races.edges[i];

          const name = edge?.node?.position?.name;
          if (existingPosition[name]) {
            continue;
          }
          existingPosition[name] = true;
          cleanRaces.push(edge.node);

          // const queueMessage = {
          //   type: 'saveBallotReadyRace',
          //   data: edge,
          // };
          // await sails.helpers.queue.enqueue(queueMessage);
        }
        // use queue to dave these to our db
      }

      cleanRaces.sort(sortRaces);

      return exits.success({
        races: cleanRaces,
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

function sortRaces(a, b) {
  const aLevel = levelValue(a.position?.level);
  const bLevel = levelValue(b.position?.level);
  return aLevel - bLevel;
}

function levelValue(level) {
  if (level === 'FEDERAL') {
    return 10;
  }
  if (level === 'STATE') {
    return 8;
  }

  if (level === 'COUNTY') {
    return 6;
  }
  if (level === 'CITY') {
    return 4;
  }
  if (level === 'LOCAL') {
    return 0;
  }
  return 12;
}
