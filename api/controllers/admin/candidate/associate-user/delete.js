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
      await Candidate.updateOne({ id: candidateId }).set({
        user: [],
      });

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('Error at admin/candidate/associate-user/delete', e);
      return exits.badRequest({
        message: 'Error deleting association',
      });
    }
  },
};
