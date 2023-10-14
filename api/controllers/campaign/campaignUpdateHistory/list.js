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
        const campaigns = await Campaign.find({
          user: user.id,
        });

        if (campaigns && campaigns.length > 0) {
          campaign = campaigns[0];
        }
      }

      const updateHistory = await CampaignUpdateHistory.find({
        campaign: campaign.id,
      }).populate('user');

      updateHistory.forEach((update) => {
        update.user = {
          name: update.user.name,
          avatar: update.user.avatar,
        };
      });

      return exits.success({
        updateHistory,
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
