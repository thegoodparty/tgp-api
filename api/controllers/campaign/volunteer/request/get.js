const {
  userIsCampaignManager,
} = require('../../../../utils/campaign/userIsCampaignManager');

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
  },

  fn: async function (inputs, exits) {
    const { id: requestId, userId } = inputs;
    const { user } = this.req;

    try {
      if (userId) {
        const campaignRequests = await CampaignRequest.find({
          user: userId,
        }).populate('user');

        return exits.success(campaignRequests || []);
      }

      if (requestId) {
        const campaignRequest = await CampaignRequest.findOne({
          id: requestId,
        }).populate('user');

        if (!campaignRequest) {
          throw 'notFound';
        }

        if (campaignRequest.user.id === user.id) {
          return exits.success(campaignRequest);
        }

        const campaign = await sails.helpers.campaign.byUser(user.id);

        if (!campaign) {
          throw new Error('User not authorized');
        }

        const userIsCampaignCandidate = Boolean(campaign?.user === user.id);

        if (
          userIsCampaignCandidate ||
          (await userIsCampaignManager(user.id, campaign.id))
        ) {
          return exits.success(campaignRequest);
        }
      }
      throw new Error('User not authorized');
    } catch (e) {
      if (e === 'notFound') {
        throw e;
      }
      console.error('error getting campaign requests', e);
      return exits.error(e);
    }
  },
};
