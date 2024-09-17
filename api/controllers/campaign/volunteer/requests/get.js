module.exports = {
  friendlyName: 'GetCampaignTeamRequests',

  description: 'Get request(s) to join a campaign team',

  inputs: {
    id: {
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
  },

  fn: async function (_, exits) {
    const { user, params } = this.req;
    const campaign = await sails.helpers.campaign.byUser(user.id);
    const { requestId } = params || {};

    // TODO: ensure that only candidates, managers, and admins can see campaign
    //  requests related to their campaigns
    try {
      if (!campaign) {
        throw new Error('No campaign found for authenticated user');
      }

      const campaignRequests = requestId
        ? await Requests.findOne({
            id: requestId,
            campaign: campaign.id,
          }).populate('user')
        : await Requests.find({
            campaign: campaign.id,
          }).populate('user');

      return exits.success(campaignRequests);
    } catch (e) {
      console.error('error getting campaign requests', e);
      return exits.error(e);
    }
  },
};
