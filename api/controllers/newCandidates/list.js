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
    filters: {
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
      const { filters } = inputs;
      const candidates = await Candidate.find({
        where: { isActive: true },
      }).populate('candidateIssueItems');

      const activeCandidates = [];
      const currentYear = new Date().getFullYear();
      const janFirst = new Date(`01-01-${currentYear}`);
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
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
          topics: candidate.candidateIssueItems,
        });
      }
      let filtered = activeCandidates;
      let positionNames = [];
      const topics = await IssueTopic.find();
      if (filters) {
        const queryPositions = filters.split(',');
        const positions = [];
        queryPositions.forEach(position => {
          positions.push({ id: position });
        });
        filtered = filterCandidates(activeCandidates, positions);

        positionNames = getPositions(topics, queryPositions);
      }
      return exits.success({
        candidates: filtered,
        positionNames,
        topics,
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
