/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Homepage Candidate',

  description: 'Homepage Candidate ',

  inputs: {},

  exits: {
    success: {
      description: 'Candidates Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Candidates Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const candidates = await Candidate.find({
        isActive: true,
        isOnHomepage: true,
      }).limit(6);

      const homepageCandidates = [];
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const data = JSON.parse(candidate.data);
        const {
          id,
          firstName,
          lastName,
          image,
          color,
          race,
          party,
          raceDate,
          votesNeeded,
          isClaimed,
        } = data;

        const followers = await sails.helpers.socialListening.candidateFollowersHelper(
          candidate,
        );
        const support = await sails.helpers.support.supportByCandidate(id);

        homepageCandidates.push({
          id,
          firstName,
          lastName,
          image,
          color,
          race,
          party,
          followers,
          raceDate,
          votesNeeded,
          isClaimed,
          support,
        });
      }

      homepageCandidates.sort((a, b) => {
        if (a.followers && b.followers) {
          return b.followers.thisWeek - a.followers.thisWeek;
        }
        return 0;
      });

      return exits.success({
        homepageCandidates,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
