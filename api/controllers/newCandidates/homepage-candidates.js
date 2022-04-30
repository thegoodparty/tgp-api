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
      }).limit(3);

      const homepageCandidates = [];
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];

        const data = JSON.parse(candidate.data);
        delete data.comparedCandidates;
        delete data.updates;
        delete data.updatesDates;
        const supporters = await Support.count({
          candidate: candidate.id,
        });

        data.supporters = supporters || 0;

        homepageCandidates.push(data);
      }

      homepageCandidates.sort((a, b) => {
        return b.supporters - a.supporters;
      });

      /*
      adding endorsment count.
      static follower from social networks as of 04/29/22
      TikTok: 132,200
      Instagram:  597
      Facebook: 376 followers + 5761 engagements
      Twitter: 314 followers, 138 likes
      = 134222
       */
      const socialFollowers = 137373;
      const supportCount = await Support.count();
      const shareCount = await ShareCandidate.count();

      return exits.success({
        homepageCandidates,
        engagements: socialFollowers + supportCount + shareCount,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
