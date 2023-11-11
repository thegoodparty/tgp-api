module.exports = {
  inputs: {
    description: {
      type: 'string',
      required: true,
    },
    campaignSlug: {
      type: 'string',
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
      const { description, campaignSlug, positionId, topIssueId, order } =
        inputs;
      const campaign = await Campaign.findOne({ slug: campaignSlug });
      const canAccess = await sails.helpers.staff.canAccess(campaign, user);
      if (!canAccess) {
        return exits.forbidden();
      }

      // const existing = await CandidatePosition.findOne({
      //   topIssue: topIssueId,
      //   campaign: campaign.id,
      // });
      // if (existing) {
      //   return exits.badRequest({
      //     message: 'This top issue already exists for this campaign',
      //   });
      // }

      const newPosition = await CandidatePosition.create({
        description,
        campaign: campaign.id,
        position: positionId,
        topIssue: topIssueId,
        order,
      }).fetch();
      // update the many to many relationships
      await Campaign.addToCollection(campaign.id, 'positions', positionId);
      await Campaign.addToCollection(campaign.id, 'topIssues', topIssueId);

      await sails.helpers.crm.updateCampaign(campaign);

      return exits.success({
        newPosition,
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
