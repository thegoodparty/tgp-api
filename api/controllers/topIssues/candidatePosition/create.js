module.exports = {
  inputs: {
    description: {
      type: 'string',
      required: true,
    },
    candidateId: {
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
    order: {
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
      const {
        description,
        candidateId,
        positionId,
        topIssueId,
        order,
      } = inputs;
      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }

      const existing = await CandidatePosition.findOne({
        topIssue: topIssueId,
        candidate: candidateId,
      });
      if (existing) {
        return exits.badRequest({
          message: 'This top issue already exists for this candidate',
        });
      }

      await CandidatePosition.create({
        description,
        candidate: candidateId,
        position: positionId,
        topIssue: topIssueId,
        order,
      });
      // update the many to many relationships
      await Candidate.addToCollection(candidateId, 'positions', positionId);
      await Candidate.addToCollection(candidateId, 'topIssues', topIssueId);

      await sails.helpers.crm.updateCandidate(candidate);

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('error at issue position/create', e);
      return exits.badRequest({
        message: 'Error creating issue position',
        e,
      });
    }
  },
};
