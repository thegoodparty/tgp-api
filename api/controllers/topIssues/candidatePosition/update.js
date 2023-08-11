module.exports = {
  inputs: {
    description: {
      type: 'string',
    },
    id: {
      type: 'number',
      required: true,
    },
    order: {
      type: 'number',
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
      const { id, description, order } = inputs;
      const candidatePosition = await CandidatePosition.findOne({ id });
      const candidate = await Candidate.findOne({
        id: candidatePosition.candidate,
      });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess) {
        return exits.forbidden();
      }
      if (order) {
        await CandidatePosition.updateOne({ id }).set({
          order,
        });
      }
      if (description) {
        await CandidatePosition.updateOne({ id }).set({
          description,
        });
      }

      await sails.helpers.crm.updateCandidate(candidate);

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
