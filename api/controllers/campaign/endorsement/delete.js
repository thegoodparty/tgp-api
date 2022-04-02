module.exports = {
  friendlyName: 'Delete an endorsement',

  inputs: {
    candidateId: {
      required: true,
      type: 'number',
    },
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Deleted',
    },

    badRequest: {
      description: 'Error deleting',
      responseType: 'badRequest',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id, candidateId } = inputs;
      const { user } = this.req;

      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }
      await Endorsement.destroyOne({
        id,
      });

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at campaign/endorsement/delete', e);
      return exits.badRequest({
        message: 'Error deleting endorsement',
        e,
      });
    }
  },
};
