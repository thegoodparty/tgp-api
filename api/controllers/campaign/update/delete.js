module.exports = {
  friendlyName: 'delete Candidate update',

  description: 'Portal endpoint to delete update',

  inputs: {
    candidateId: {
      type: 'number',
      required: true,
    },
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Delete',
      responseType: 'ok',
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
      const { user } = this.req;

      const { candidateId, id } = inputs;
      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess) {
        return exits.forbidden();
      }

      await CampaignUpdate.destroyOne({
        id,
        candidate: candidateId,
      });

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('Error deleting campaign updates', e);
      return exits.badRequest({ message: 'Error deleting campaign updates' });
    }
  },
};
