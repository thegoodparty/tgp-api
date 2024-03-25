// https://developers.civicengine.com/docs/api/graphql

const moment = require('moment');

const isPOTUSorVPOTUSNode = ({position}) =>
  position?.level === 'FEDERAL' && position?.name?.toLowerCase().includes('president')

const sortRacesGroupedByYear = (elections = {}) => Object
.keys(elections)
.reduce(
  (agg, electionYear) => ({
    ...agg,
    [electionYear]: elections[electionYear].sort(sortRacesByLevel)
  }),
  {}
)

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
      const nextYear = moment().add(4, 'year').format('YYYY-MM-DD');
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
      const existingPositions = {};
      const electionsByYear = {}
      // group races by year and level
      if (races?.edges) {
        for (let i = 0; i < races.edges.length; i++) {
          const { node } = races.edges[i] || {};
          const { electionDay } = node?.election || {}
          const { name } = node?.position || {}
          const electionYear = (new Date(electionDay)).getFullYear()

          if (
            existingPositions[`${name}|${electionYear}`] ||
            (node && isPOTUSorVPOTUSNode(node))
          ) {
            continue;
          }

          existingPositions[`${name}|${electionYear}`] = true;

          electionsByYear[electionYear] ?
            electionsByYear[electionYear].push(node) :
            electionsByYear[electionYear] = [node]
        }
        // TODO: Use queue to save these to our db
      }

      return exits.success(sortRacesGroupedByYear(electionsByYear));
    } catch (e) {
      console.log('error at ballotData/get', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};

function sortRacesByLevel(a, b) {
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
