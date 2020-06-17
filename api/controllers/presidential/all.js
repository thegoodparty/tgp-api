/**
 * incumbents/all.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const votesThreshold = require('../../../data/presidentialThreshold');

module.exports = {
  friendlyName: 'Find all Presidential Candidates',

  description: 'Find all Presidential Candidates ',

  inputs: {
    userState: {
      type: 'string',
      required: false,
      example: 'ca',
    },
    state: {
      type: 'string',
      required: false,
      example: 'ca',
    },
    zip: {
      type: 'string',
      required: false,
      example: '90210',
    },
  },

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
      const { userState, state, zip } = inputs;
      const candidates = await PresidentialCandidate.find({
        isActive: true,
      }).sort([{ isIncumbent: 'DESC' }, { order: 'ASC' }]);
      const good = [];
      const notGood = [];
      const unknown = [];
      const presidentialThreshold = 50000000;

      let topRank = 0;
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
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
          if (ranking > topRank) {
            topRank = ranking;
          }
          good.push({
            ...candidate,
            isGood,
            ranking,
          });
        } else if (isGood === false) {
          notGood.push({
            ...candidate,
            isGood,
          });
        } else {
          const ranking = await Ranking.count({
            candidate: candidate.id,
          });
          if (ranking > topRank) {
            topRank = ranking;
          }
          unknown.push({
            ...candidate,
            isGood,
            ranking,
          });
        }
      }
      let threshold = 38658139;
      if (state) {
        threshold = votesThreshold[state];
      } else if (zip) {
        const zipRecord = await ZipCode.findOne({ zip });
        if (zipRecord) {
          threshold = votesThreshold[zipRecord.stateShort];
        }
      } else if (userState) {
        threshold = votesThreshold[userState];
      }

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
      return exits.notFound();
    }
  },
};
