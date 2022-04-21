module.exports = {
  inputs: {
    candidateId: {
      required: true,
      type: 'number',
    },
    endorsement: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Updated',
    },

    badRequest: {
      description: 'Error updating',
      responseType: 'badRequest',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  async fn(inputs, exits) {
    try {
      const { candidateId, endorsement } = inputs;
      const { user } = this.req;

      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }

      if (
        !endorsement.title ||
        !endorsement.summary ||
        endorsement.candidate !== candidateId
      ) {
        return exits.badRequest({
          message: 'Missing Required fields',
        });
      }
      await Endorsement.updateOne({ id: endorsement.id }).set(endorsement);

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at campaign/endorsement/update', e);
      return exits.badRequest({
        message: 'Error updating endorsement',
        e,
      });
    }
  },
};
