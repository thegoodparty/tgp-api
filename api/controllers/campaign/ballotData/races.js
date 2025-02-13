// https://developers.civicengine.com/docs/api/graphql

const moment = require('moment');
const { truncateZip } = require('../../../utils/truncateZip');

const isPOTUSorVPOTUSNode = ({ position }) =>
  position?.level === 'FEDERAL' &&
  position?.name?.toLowerCase().includes('president');

module.exports = {
  friendlyName: 'Health',

  description: 'root level health check',

  inputs: {
    zip: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 5,
    },
    level: {
      type: 'string',
    },
    electionDate: {
      type: 'string',
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
      const { zip, level, electionDate } = inputs;
      await sails.helpers.slack.errorLoggerHelper(
        'office picker inputs',
        inputs,
      );

      let startCursor;

      let query = getRaceQuery(zip, level, electionDate, startCursor);
      await sails.helpers.slack.errorLoggerHelper('office query', { query });
      let { races } = await sails.helpers.graphql.queryHelper(query);
      let existingPositions = {};
      let elections = [];
      let primaryElectionDates = {}; // key - positionId, value - electionDay and raceId (primary election date)
      let hasNextPage = false;

      if (races?.edges) {
        hasNextPage = races.pageInfo.hasNextPage;
        startCursor = races.pageInfo.endCursor;
        const raceResponse = parseRaces(
          races,
          existingPositions,
          elections,
          primaryElectionDates,
        );
        existingPositions = raceResponse.existingPositions;
        elections = raceResponse.elections;
        primaryElectionDates = raceResponse.primaryElectionDates;
      }

      while (hasNextPage === true) {
        query = getRaceQuery(zip, level, electionDate, startCursor);
        const queryResponse = await sails.helpers.graphql.queryHelper(query);
        races = queryResponse?.races;
        if (races) {
          const raceResponse = parseRaces(
            races,
            existingPositions,
            elections,
            primaryElectionDates,
          );
          existingPositions = raceResponse.existingPositions;
          elections = raceResponse.elections;
          primaryElectionDates = raceResponse.primaryElectionDates;
          hasNextPage = races?.pageInfo?.hasNextPage || false;
          startCursor = races?.pageInfo?.endCursor;
        }
      }

      return exits.success(elections);
    } catch (e) {
      console.log('error at ballotData/get', e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};

function parseRaces(races, existingPositions, elections, primaryElectionDates) {
  for (let i = 0; i < races.edges.length; i++) {
    const { node } = races.edges[i] || {};
    const { isPrimary } = node || {};
    const { electionDay, name: electionName } = node?.election || {};
    const { name, hasPrimary, partisanType } = node?.position || {};

    const electionYear = new Date(electionDay).getFullYear();
    // console.log(`Processing ${name} ${electionYear}`);

    if (existingPositions[`${name}|${electionYear}`]) {
      continue;
    }

    if (electionName.includes('Runoff')) {
      continue;
    }

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

    elections.push(node);
  }
  // iterate over the races again and save the primary election date to the general election
  // the position id will be the same for both primary and general election
  // is partisanType is 'partisan' we can ignore the primary election date
  for (let i = 0; i < races.edges.length; i++) {
    const { node } = races.edges[i] || {};
    const { isPrimary } = node || {};
    const { hasPrimary, id, partisanType } = node?.position || {};
    if (partisanType === 'partisan') {
      continue;
    }
    const { electionDay, name } = node?.election || {};

    const electionYear = new Date(electionDay).getFullYear();
    const primaryElectionDate = primaryElectionDates[`${id}|${electionYear}`];
    if (id && hasPrimary && !isPrimary && primaryElectionDate) {
      node.election.primaryElectionDate = primaryElectionDate.electionDay;
      node.election.primaryElectionId = primaryElectionDate.primaryElectionId;
    }
  }
  return { elections, existingPositions, primaryElectionDates };
}

function getRaceQuery(zip, level, electionDate, startCursor) {
  const gt = moment(electionDate).startOf('month').format('YYYY-MM-DD');
  const lt = moment(electionDate).endOf('month').format('YYYY-MM-DD');
  let levelWithTownship = level?.toUpperCase();
  if (level === 'LOCAL') {
    levelWithTownship = 'LOCAL,TOWNSHIP';
  }

  const query = `
  query {
    races(
      location: {
        zip: "${truncateZip(zip)}"
      }
      filterBy: {
        ${
          electionDate
            ? `electionDay: {
          gt: "${gt}"
          lt: "${lt}"
        }`
            : ''
        }
        level: [${levelWithTownship}]
      }
      after: ${startCursor ? `"${startCursor}"` : null}
    ) {
      edges {
        node {
          id
          isPrimary
          election {
            id
            electionDay
            name
            state
          }
          position {
            id
            hasPrimary
            partisanType
            level
            name
            state

            normalizedPosition {
              name
            }
          }

        }
      }
      pageInfo {
        endCursor
        hasNextPage
        hasPreviousPage
        startCursor
      }
    }
  }
  `;
  return query;
}
