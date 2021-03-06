/**
 * incumbents/all.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Find all Presidential Candidates',

  description: 'Find all Presidential Candidates ',

  inputs: {},

  exits: {
    success: {
      description: 'Presidential Candidates Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Presidential Candidates Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const cached = await sails.helpers.cacheHelper('get', 'presidential');
      if (cached) {
        return exits.success(cached);
      }
      const candidates = await PresidentialCandidate.find({
        isActive: true,
        isHidden: false,
      }).sort([{ isIncumbent: 'DESC' }, { order: 'ASC' }]);
      const good = [];
      const notGood = [];
      const unknown = [];
      const presidentialThreshold = 50000000;

      let topRank = 0;
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const candidateWithoutTwitter = _.omit(candidate, 'twitterFollowers');
        const twitterFollowers = candidate.twitterFollowers || 0;
        candidate.chamber = 'Presidential';
        const { isGood } = await sails.helpers.goodnessHelper(
          candidate,
          'presidential',
          presidentialThreshold,
        );
        if (isGood === true) {
          const ranking = await Ranking.count({
            candidate: candidate.id,
          });
          if (ranking + twitterFollowers > topRank) {
            topRank = ranking + twitterFollowers;
          }
          const votesNeeded = await sails.helpers.votesNeeded(candidate);

          good.push({
            ...candidateWithoutTwitter,
            isGood,
            ranking: ranking + twitterFollowers,
            votesNeeded,
          });
        } else if (isGood === false) {
          notGood.push({
            ...candidateWithoutTwitter,
            isGood,
          });
        } else {
          const ranking = await Ranking.count({
            candidate: candidate.id,
          });
          if (ranking + twitterFollowers > topRank) {
            topRank = ranking + twitterFollowers;
          }
          const votesNeeded = await sails.helpers.votesNeeded(candidate);

          unknown.push({
            ...candidateWithoutTwitter,
            isGood,
            ranking: ranking + twitterFollowers,
            votesNeeded,
          });
        }
      }
      const threshold = 38658139;

      await sails.helpers.cacheHelper('set', 'presidential', {
        presidential: {
          good,
          notGood,
          unknown,
          topRank,
          threshold,
        },
      });
      return exits.success({
        presidential: {
          good,
          notGood,
          unknown,
          topRank,
          threshold,
        },
      });
    } catch (e) {
      console.log('Error in finding presidential candidates', e);
      await sails.helpers.errorLoggerHelper('Error at presidential/all', e);
      return exits.notFound();
    }
  },
};
