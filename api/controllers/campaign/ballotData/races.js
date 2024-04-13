// https://developers.civicengine.com/docs/api/graphql

const moment = require('moment');

const isPOTUSorVPOTUSNode = ({ position }) =>
  position?.level === 'FEDERAL' &&
  position?.name?.toLowerCase().includes('president');

const sortRacesGroupedByYear = (elections = {}) => {
  const electionYears = Object.keys(elections);
  return electionYears.reduce((aggregate, electionYear) => {
    const electionsSortedByYear =
      elections[electionYear].sort(sortRacesByLevel);
    return {
      ...aggregate,
      [electionYear]: electionsSortedByYear,
    };
  }, {});
};

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
              isPrimary
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
                hasPrimary
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
      const electionsByYear = {};
      const primaryElectionDates = {}; // key - positionId, value - electionDay and raceId (primary election date)
      // group races by year and level
      // a position with primary will have 2 races. One for primary and one for general
      if (races?.edges) {
        for (let i = 0; i < races.edges.length; i++) {
          const { node } = races.edges[i] || {};
          const { isPrimary } = node || {};
          const { electionDay } = node?.election || {};
          const { name, hasPrimary } = node?.position || {};
          const electionYear = new Date(electionDay).getFullYear();

          if (
            // skip primary if the we have primary in that race
            (hasPrimary && isPrimary) ||
            (node && isPOTUSorVPOTUSNode(node))
          ) {
            primaryElectionDates[`${node.position.id}|${electionYear}`] = {
              electionDay,
              primaryElectionId: node?.election?.id,
            };
            continue;
          }
          existingPositions[`${name}|${electionYear}`] = true;

          electionsByYear[electionYear]
            ? electionsByYear[electionYear].push(node)
            : (electionsByYear[electionYear] = [node]);
        }
        // iterate over the races again and save the primary election date to the general election
        // the position id will be the same for both primary and general election
        for (let i = 0; i < races.edges.length; i++) {
          const { node } = races.edges[i] || {};
          const { isPrimary } = node || {};
          const { hasPrimary, id } = node?.position || {};
          const { electionDay } = node?.election || {};
          const electionYear = new Date(electionDay).getFullYear();
          const primaryElectionDate =
            primaryElectionDates[`${id}|${electionYear}`];
          if (id && hasPrimary && !isPrimary && primaryElectionDate) {
            node.election.primaryElectionDate = primaryElectionDate.electionDay;
            node.election.primaryElectionId =
              primaryElectionDate.primaryElectionId;
          }
        }
      }

      const racesGroupedByYearAndSorted =
        sortRacesGroupedByYear(electionsByYear);
      return exits.success(racesGroupedByYearAndSorted);
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
