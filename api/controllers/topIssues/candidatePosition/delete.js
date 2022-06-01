module.exports = {
  inputs: {
    id: {
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
      const { id } = inputs;
      const candidatePosition = await CandidatePosition.findOne({ id });
      const candidate = await Candidate.findOne({
        id: candidatePosition.candidate,
      });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }

      await Candidate.removeFromCollection(
        id,
        'positions',
        candidatePosition.position,
      );
      await Candidate.removeFromCollection(
        id,
        'topIssues',
        candidatePosition.topIssue,
      );
      await CandidatePosition.destroyOne({ id });

      await sails.helpers.crm.updateCandidate(candidate);

      await sails.helpers.cacheHelper('clear', 'all');

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at issue position/delete', e);
      return exits.badRequest({
        message: 'Error deleting issue position',
        e,
      });
    }
  },
};
