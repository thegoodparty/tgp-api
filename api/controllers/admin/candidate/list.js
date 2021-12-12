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

  fn: async function(inputs, exits) {
    try {
      let candidates;

      candidates = await Candidate.find()
        .populate('user')
        .sort([{ updatedAt: 'DESC' }]);

      candidates = candidates.map(candidate => {
        return { ...JSON.parse(candidate.data), user: candidate.user };
      });
      return exits.success({
        candidates,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at admin/candidates', e);
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};
