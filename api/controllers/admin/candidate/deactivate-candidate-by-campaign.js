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

      candidates = await Candidate.find().sort([{ updatedAt: 'DESC' }]);
      candidates = candidates.map(candidate => {
        try {
          return JSON.parse(candidate.data);
        } catch (e) {
          console.log('error', candidate);
          return {};
        }
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
