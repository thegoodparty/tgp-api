module.exports = {
  inputs: {
    description: {
      type: 'string',
      required: true,
    },
    id: {
      type: 'number',
      required: true,
    },
    positionId: {
      type: 'number',
      required: true,
    },
    topIssueId: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Created',
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
      const { id, topIssueId, positionId, description } = inputs;
      const candidatePosition = await CandidatePosition.findOne({ id });
      const candidate = await Candidate.findOne({
        id: candidatePosition.candidate,
      });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }

      await CandidatePosition.updateOne({ id }).set({
        description,
        position: positionId,
        topIssue: topIssueId,
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at issue position/update', e);
      return exits.badRequest({
        message: 'Error creating issue position',
        e,
      });
    }
  },
};
