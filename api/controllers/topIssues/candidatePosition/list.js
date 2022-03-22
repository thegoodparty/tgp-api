module.exports = {
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Found',
    },

    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const { id } = inputs;
      const candidate = await Candidate.findOne({ id });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess) {
        return exits.forbidden();
      }

      const candidatePositions = await CandidatePosition.find({
        candidate: id,
      })
        .sort([{ order: 'ASC' }])
        .populate('topIssue')
        .populate('position');

      return exits.success({
        candidatePositions,
      });
    } catch (e) {
      console.log('error at issue candidatePositions/list', e);
      return exits.badRequest({
        message: 'Error finding candidatePositions',
        e,
      });
    }
  },
};
