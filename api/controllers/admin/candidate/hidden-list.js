module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {},

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error getting candidates',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const candidates = await Candidate.find({ isActive: false }).sort([
        { updatedAt: 'DESC' },
      ]);

      return exits.success({
        candidates,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at admin/hidden-candidates',
        e,
      );
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};
