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
    noSortByState: {
      type: 'boolean',
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
      if (inputs.noSortByState) {
        const candidates = await Candidate.find({
          where: { isActive: true },
        });
        return exits.success({
          candidates,
        });
      }
      const candidates = await Candidate.find({
        where: { isActive: true },
        sort: 'state',
      });

      const candidatesByStates = {};
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];

        const data = JSON.parse(candidate.data);
        delete data.comparedCandidates;
        delete data.updates;
        delete data.updatesDates;
        const supporters = await Support.count({
          candidate: candidate.id,
        });
        const shares = await ShareCandidate.count({
          candidate: candidate.id,
        });
        data.supporters = (supporters || 0) + (shares || 0);
        data.state = candidate.state;
        if (!candidatesByStates[candidate.state]) {
          candidatesByStates[candidate.state] = [];
        }

        candidatesByStates[candidate.state].push(data);
      }

      return exits.success({
        candidates: candidatesByStates,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
