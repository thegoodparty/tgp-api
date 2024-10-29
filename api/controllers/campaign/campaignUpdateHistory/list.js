module.exports = {
  friendlyName: 'User supports a candidate',

  inputs: {
    slug: {
      type: 'string',
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
      const user = this.req.user;
      const { slug } = inputs;

      if (slug && !user.isAdmin) {
        return exits.forbidden();
      }
      let campaign = false;
      if (slug) {
        campaign = await Campaign.findOne({ slug });
      } else {
        campaign = await sails.helpers.campaign.byUser(user.id);
      }

      if (!campaign) {
        return exits.badRequest({ message: 'No campaign found' });
      }

      const updateHistory = await CampaignUpdateHistory.find({
        campaign: campaign.id,
      }).populate('user');

      return exits.success({
        updateHistory: updateHistory.map((update) => ({
          ...update,
          user: {
            name: `${user.firstName} ${user.lastName}`,
            avatar: update?.user?.avatar,
          },
        })),
      });
    } catch (e) {
      console.log('error at campaign/campaignUpdateHistory/list', e);
      return exits.badRequest({
        message: 'Error finding updateHistory',
        e,
      });
    }
  },
};
