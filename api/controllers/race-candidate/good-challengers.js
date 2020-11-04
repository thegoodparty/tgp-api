/**
 * district/congDistrict
 *
 * @description :: returns data about one Congressional District.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'All Good Challengers',

  description: 'Get All Good Challengers from CongDistrict and SenateDistrict',

  inputs: {},

  exits: {
    success: {
      description: 'All Good Challengers',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error getting good challengers',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const cached = await sails.helpers.cacheHelper('get', 'goodChallengers');
      if (cached) {
        return exits.success({
          goodChallengers: cached,
        });
      }

      let challengersIdList = [161, 421, 859, 86, 1343, 1132, 503, 1239];

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
        // goodChallengers[i]['votesNeeded'] = await sails.helpers.votesNeeded(
        //   chamber,
        //   state,
        //   district,
        // );
        goodChallengers[i]['votesNeeded'] = await sails.helpers.votesNeeded(
          goodChallengers[i],
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
          votesReceived,
          chamber,
          smallContributions,
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
          votesReceived,
          chamber,
          smallContributions,
        });
      });
      await sails.helpers.cacheHelper(
        'set',
        'goodChallengers',
        cleanChallengers,
      );
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
