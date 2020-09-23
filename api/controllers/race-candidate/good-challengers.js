/**
 * district/congDistrict
 *
 * @description :: returns data about one Congressional District.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const presidentialYear = true;

module.exports = {
  friendlyName: 'All Good Challengers',

  description: 'Get All Good Challengers from CongDistrict and SenateDistrict',

  inputs: {},

  exits: {
    success: {
      description: 'All Good Challegers',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error getting good challengers',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const challengersIdList = [161, 421, 859, 86, 656, 1132, 503, 1239];
      const goodChallengers = await RaceCandidate.find({
        isActive: true,
        isHidden: false,
        id: challengersIdList,
      });
      goodChallengers.sort((a, b) => {
        return (
          challengersIdList.indexOf(a.id) - challengersIdList.indexOf(b.id)
        );
      });
      for (let i = 0; i < goodChallengers.length; i++) {
        let { chamber, state, district } = goodChallengers[i];
        if (chamber === 'Senate') {
          goodChallengers[i]['district'] = undefined;
        }
        goodChallengers[i]['votesNeeded'] = await sails.helpers.votesNeeded(
          chamber,
          state,
          district,
        );
        const { incumbent } = await sails.helpers.incumbentByDistrictHelper(
          state,
          goodChallengers[i]['district'],
        );
        goodChallengers[i]['incumbentRaised'] = incumbent['raised'];
      }
      const cleanChallengers = [];
      goodChallengers.forEach(challenger => {
        const {
          id,
          district,
          image,
          incumbentRaised,
          likelyVoters,
          name,
          party,
          raised,
          state,
          votesNeeded,
        } = challenger;
        cleanChallengers.push({
          id,
          district,
          image,
          incumbentRaised,
          likelyVoters,
          name,
          party,
          raised,
          state,
          votesNeeded,
        });
      });
      return exits.success({
        goodChallengers: cleanChallengers,
      });
    } catch (err) {
      console.log(err);
      return exits.badRequest({
        message: 'race-candidates/good-challengers error',
      });
    }
  },
};
