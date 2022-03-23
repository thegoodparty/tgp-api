/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'All Candidates',

  description: 'All Candidates',

  inputs: {
    position: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Candidates Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Candidates Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { position, state } = inputs;
      const criteria = { isActive: true };
      if (state) {
        criteria.state = state;
      }
      let positionId = false;
      if (position && position !== 'all') {
        positionId = parseInt(position.split('|')[1], 10);
      }
      const positionCriteria = {};
      if (positionId) {
        positionCriteria.id = positionId;
      }
      const candidates = await Candidate.find(criteria).populate('positions');

      const activeCandidates = [];
      const possibleStates = {};
      const currentYear = new Date().getFullYear();
      const janFirst = new Date(`01-01-${currentYear}`);
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        if (positionId) {
          let hasPosition = false;
          // filter candidates who don't match the position id
          for (let j = 0; j < candidate.positions.length; j++) {
            if (candidate.positions[j].id === positionId) {
              hasPosition = true;
              break;
            }
          }
          if (!hasPosition) {
            continue; // skip this candidate
          }
        }
        const data = candidate.data ? JSON.parse(candidate.data) : {};
        const { raceDate } = data;
        // skip candidates with a race date before this calendar year.
        if (raceDate) {
          const date = new Date(raceDate);
          if (date < janFirst) {
            continue;
          }
        }

        const {
          firstName,
          lastName,
          id,
          headline,
          image,
          party,
          race,
          state,
          zip,
        } = data;

        activeCandidates.push({
          firstName,
          lastName,
          id,
          headline,
          image,
          party,
          race,
          state,
          zip,
          positions: candidate.positions,
        });
        if (candidate.state && candidate.state !== '') {
          possibleStates[candidate.state] = candidate.state;
        }
      }
      let filtered = activeCandidates;
      // if (filters) {
      //   const queryPositions = filters.split(',');
      //   const positions = [];
      //   queryPositions.forEach(position => {
      //     positions.push({ id: position });
      //   });
      //   filtered = filterCandidates(activeCandidates, positions);
      //
      //   positionNames = getPositions(topIssues, queryPositions);
      // }
      const positions = await Position.find()
        .populate('candidates')
        .sort([{ name: 'ASC' }]);
      const filteredPositions = positions.filter(
        position => position.candidates.length > 0,
      );
      const states = Object.values(possibleStates);
      states.sort();
      return exits.success({
        candidates: filtered,
        positions: filteredPositions,
        states,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.badRequest({ message: 'error finding candidates' });
    }
  },
};

const filterCandidates = (allCandidates, positions) => {
  if (positions.length === []) {
    return allCandidates;
  }
  const filtered = allCandidates.filter(candidate => {
    if (candidate.topics) {
      for (let i = 0; i < candidate.topics.length; i++) {
        const positionId = candidate.topics[i].positionId;
        if (positions.find(position => position.id === positionId)) {
          return true;
        }
      }
    }
    return false;
  });
  return filtered;
};

const getPositions = (topics, positions) => {
  const positionsNames = [];

  const idToName = {};
  topics.forEach(topic => {
    if (topic.positions) {
      topic.positions.forEach(position => {
        idToName[position.id] = position.name;
      });
    }
  });
  positions.forEach(positionId => {
    if (idToName[positionId]) {
      positionsNames.push(idToName[positionId]);
    }
  });
  return positionsNames;
};
