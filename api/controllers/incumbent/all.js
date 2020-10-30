/**
 * incumbents/all.js
 *
 * @description :: Find all incumbents.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
module.exports = {
  friendlyName: 'Find all Incumbents',

  description: 'Find all incumbents',

  inputs: {},

  exits: {
    success: {
      description: 'Incumbents Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Incumbents Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const cached = await sails.helpers.cacheHelper('get', 'all-incumbents');
      if (cached) {
        return exits.success(cached);
      }
      const incumbents = await Incumbent.find({
        isActive: true,
        isHidden: false,
      });
      for (let i = 0; i < incumbents.length; i++) {
        const candidate = incumbents[i];
        const chamber = candidate.chamber.toLowerCase();
        const { state, district } = candidate || {};
        const incumbent = await sails.helpers.incumbentByDistrictHelper(
          state,
          district,
        );
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

        const {
          isGood,
          isBigMoney,
          isMajor,
        } = await sails.helpers.goodnessHelper(
          candidate,
          chamber,
          incumbentRaised,
        );
        candidate.isGood = isGood;
        candidate.isBigMoney = isBigMoney;
        candidate.isMajor = isMajor;
        candidate.isIncumbent = true;
      }
      await sails.helpers.cacheHelper(
        'set',
        'all-incumbents',
        incumbents,
      );
      return exits.success({
        incumbents,
      });
    } catch (e) {
      // await sails.helpers.errorLoggerHelper(
      //   'Error at incumbent/find-by-district',
      //   e,
      // );
      console.log('Error in find by district', e);
      return exits.notFound();
    }
  },
};
