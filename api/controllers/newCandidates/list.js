/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'All Candidates',

  description: 'All Candidates',

  inputs: {},

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

      return exits.success({
        candidates: activeCandidates,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.badRequest({ message: 'error finding candidates' });
    }
  },
};
