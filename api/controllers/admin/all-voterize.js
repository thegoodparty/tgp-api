module.exports = {
  friendlyName: 'All Voterize',

  description: 'admin call for getting all Voterize',

  inputs: {
  },

  exits: {
    success: {
      description: 'All Voterize',
    },

    badRequest: {
      description: 'Error getting Voterize',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidates } = await sails.helpers.voterizeCandidates();
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
