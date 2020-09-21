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
      const challengersIdList = [161, 421, 859, 86, 656, 1132, 503]
      const goodChallengers = await RaceCandidate.find({
        isActive: true,
        isHidden: false,
        id: challengersIdList
      }).sort([{ raised: 'DESC' }]);
      for(let i = 0; i < goodChallengers.length; i++) {
        let { chamber, state, district } = goodChallengers[i];
        if(chamber === 'Senate') {
          district = null;
          goodChallengers[i]['district'] = null;
        }
        goodChallengers[i]['votesNeeded'] = await sails.helpers.votesNeeded(chamber, state, district);
        const { incumbent } = await sails.helpers.incumbentByDistrictHelper(
          state,
          district,
        );
        goodChallengers[i]['incumbentRaised'] = incumbent['raised'];
      }
      return exits.success({
        goodChallengers
      });
    } catch (err) {
      return exits.badRequest({
        message: 'Error getting divisions.',
      });
    }
  },
};
