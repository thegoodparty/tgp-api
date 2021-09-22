module.exports = {
  inputs: {
    candidateId: {
      type: 'number',
      required: true,
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

  async fn(inputs, exits) {
    try {
      const { candidateId } = inputs;
      const { user } = await Candidate.findOne({ id: candidateId }).populate(
        'user',
      );
      let resolved = false;
      if (user && user.length === 1) {
        resolved = user[0];
      }
      return exits.success({
        user: resolved,
      });
    } catch (e) {
      console.log('Error at admin/candidate/associate-user', e);
      await sails.helpers.errorLoggerHelper(
        'Error at admin/candidate/associate-user',
        e,
      );
      return exits.badRequest({
        message: 'Error associating user and candidate',
      });
    }
  },
};
