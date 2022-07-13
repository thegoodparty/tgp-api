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
    badRequest: {
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
        const { id, firstName, lastName, image, color } = data;
        const supporters = await Support.count({
          candidate: candidate.id,
        });

        data.supporters = supporters || 0;

        homepageCandidates.push({
          id,
          firstName,
          lastName,
          image,
          color,
          supporters: supporters || 0,
        });
      }

      homepageCandidates.sort((a, b) => {
        return b.supporters - a.supporters;
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
