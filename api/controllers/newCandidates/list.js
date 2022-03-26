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

      const positionsByTopIssues = {};

      const positions = await Position.find()
        .populate('candidates')
        .populate('topIssue')
        .sort([{ name: 'ASC' }]);

      positions.forEach(position => {
        if (position.candidates.length > 0) {
          if (!positionsByTopIssues[position.topIssue.name]) {
            positionsByTopIssues[position.topIssue.name] = [];
          }
          positionsByTopIssues[position.topIssue.name].push(position);
        }
      });

      const filteredPositions = positions.filter(
        position => position.candidates.length > 0,
      );
      const states = Object.values(possibleStates);
      states.sort();
      return exits.success({
        candidates: activeCandidates,
        positions: filteredPositions,
        positionsByTopIssues,
        states,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.badRequest({ message: 'error finding candidates' });
    }
  },
};
