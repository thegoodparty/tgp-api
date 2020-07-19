/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const votesThreshold = require('../../../data/presidentialThreshold');

module.exports = {
  friendlyName: 'Find by id one Presidential Candidates',

  description: 'Find by id one Presidential Candidates ',

  inputs: {
    id: {
      type: 'string',
      required: true,
    },
    chamber: {
      type: 'string',
      required: true,
    },
    isIncumbent: {
      type: 'boolean',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Presidential Candidate Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Presidential Candidate Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, chamber, isIncumbent} = inputs;
      let candidate;

      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.findOne({ id, isActive: true });
      } else {
        const upperChamber = chamber.charAt(0).toUpperCase() + chamber.slice(1);
        if (isIncumbent) {
          candidate = await Incumbent.findOne({
            id,
            chamber: upperChamber,
          });
          if (candidate) {
            candidate.isIncumbent = true;
          }
        } else {
          candidate = await RaceCandidate.findOne({
            id,
            chamber: upperChamber,
            isActive: true,
          });
        }
      }

      if (!candidate) {
        return exits.notFound();
      }

      let incumbent;
      const { state, district } = candidate || {};
      if (chamber === 'presidential') {
        ({ incumbent } = await sails.helpers.incumbentByDistrictHelper());
      } else if (chamber === 'senate') {
        ({ incumbent } = await sails.helpers.incumbentByDistrictHelper(state));
      } else if (chamber === 'house') {
        ({ incumbent } = await sails.helpers.incumbentByDistrictHelper(
          state,
          district,
        ));
      }

      let incumbentRaised = 50000000;
      if (chamber !== 'presidential') {
        if (candidate.isIncumbent) {
          incumbentRaised = candidate.raised;
        } else {
          incumbentRaised = incumbent
            ? incumbent.raised || incumbent.combinedRaised
            : false;
          incumbentRaised = incumbentRaised ? incumbentRaised / 2 : false;
        }
      }

      let rankingCount = await Ranking.count({
        candidate: candidate.id,
        chamber,
        isIncumbent,
      });

      const { isGood, isBigMoney } = await sails.helpers.goodnessHelper(
        candidate,
        chamber,
        incumbentRaised,
      );
      candidate.isGood = isGood;
      candidate.isBigMoney = isBigMoney;

      let votesNeeded;
      if (chamber === 'presidential') {
        votesNeeded = 38658139;
      } else if (chamber === 'senate') {
        const stateRecord = await State.findOne({ shortName: candidate.state });
        if (stateRecord) {
          votesNeeded =
            Math.max(
              stateRecord.writeInThreshold,
              stateRecord.writeInThresholdWithPresident,
            ) + 1;
        }
      } else {
        const stateRecord = await State.findOne({ shortName: candidate.state });
        const congDistrict = await CongDistrict.findOne({
          state: stateRecord.id,
          code: candidate.district,
        });
        if (congDistrict) {
          votesNeeded =
            Math.max(
              congDistrict.writeInThreshold,
              congDistrict.writeInThresholdWithPresident,
            ) + 1;
        }
      }

      const candidateCombinedRanking = _.omit(candidate, 'twitterFollowers');
      return exits.success({
        ...candidateCombinedRanking,
        rankingCount: rankingCount + candidate.twitterFollowers,
        votesNeeded,
      });
    } catch (e) {
      await sails.helpers.errorLoggerHelper('Error at candidates/find', e);
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
