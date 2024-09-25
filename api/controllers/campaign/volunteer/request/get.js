module.exports = {
  friendlyName: 'GetCampaignTeamRequests',

  description: 'Get request(s) to join a campaign team',

  inputs: {
    id: {
      type: 'number',
    },
    userId: {
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Campaign Requests were found.',
    },
    error: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
    notFound: {
      description: 'notFound',
      responseType: 'notFound',
    },
    forbidden: {
      description: 'User not authorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    const { id: requestId, userId } = inputs;
    const { user } = this.req;

    try {
      if (user.id === userId) {
        const campaignRequests = await CampaignRequest.find({
          user: userId,
        }).populate('user');

        return exits.success(campaignRequests || []);
      }

      const campaign = await sails.helpers.campaign.byUser(user.id);
      if (!campaign) {
        return exits.forbidden();
      }

      if (!requestId && !userId) {
        const campaignRequests = await CampaignRequest.find({
          campaign: campaign.id,
        }).populate('user');
        return exits.success(campaignRequests || []);
      }

      if (requestId) {
        const campaignRequest = await CampaignRequest.findOne({
          id: requestId,
        }).populate('user');

        if (!campaignRequest) {
          return exits.notFound();
        }

        if (
          campaignRequest.user.id === user.id ||
          campaignRequest.campaign === campaign.id
        ) {
          return exits.success(campaignRequest);
        }

        return exits.forbidden();
      }

      return exit.badRequest('Invalid request');
    } catch (e) {
      console.error('error getting campaign requests', e);
      return exits.error(e);
    }
  },
};
