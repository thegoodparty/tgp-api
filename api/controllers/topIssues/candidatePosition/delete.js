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
      const campaign = await Campaign.findOne({
        id: candidatePosition.campaign,
      });
      const canAccess = await sails.helpers.staff.canAccess(campaign, user);
      if (!canAccess) {
        return exits.forbidden();
      }

      await Campaign.removeFromCollection(
        campaign.id,
        'positions',
        candidatePosition.position,
      );
      await Campaign.removeFromCollection(
        campaign.id,
        'topIssues',
        candidatePosition.topIssue,
      );
      await CandidatePosition.destroyOne({ id });

      await sails.helpers.crm.updateCampaign(campaign);

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
