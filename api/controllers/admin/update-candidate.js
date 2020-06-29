module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {
    id: {
      type: 'number',
    },
    updatedFields: {
      type: 'json',
    },
    chamber: {
      type: 'string',
    },
    isIncumbent: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error getting candidates',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, updatedFields, chamber, isIncumbent } = inputs;

      let candidate;
      if (chamber === 'presidential') {
        candidate = await PresidentialCandidate.updateOne({
          id,
        }).set(updatedFields);
      } else if (isIncumbent) {
        candidate = await Incumbent.updateOne({
          id,
        }).set(updatedFields);
        candidate.isIncumbent = true;
      } else {
        candidate = await RaceCandidate.updateOne({
          id,
        }).set(updatedFields);
      }

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

      return exits.success({
        candidate,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at admin/update-candidate', e);
      return exits.badRequest({
        message: 'Error updating candidates',
      });
    }
  },
};
