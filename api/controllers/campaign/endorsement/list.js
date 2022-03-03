module.exports = {
  friendlyName: 'User supports a candidate',

  inputs: {
    candidateId: {
      required: true,
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
      const { candidateId } = inputs;
      const { user } = this.req;

      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }
      const endorsements = await Endorsement.find({
        candidate: candidateId,
      });

      return exits.success({
        endorsements,
      });
    } catch (e) {
      console.log('error at campaign/endorsement/list', e);
      return exits.badRequest({
        message: 'Error finding endorsement',
        e,
      });
    }
  },
};
