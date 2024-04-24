module.exports = {
  friendlyName: 'Delete aiContent',

  inputs: {
    key: {
      type: 'string',
      required: true,
    },
    subSectionKey: {
      type: 'string',
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
      const user = this.req.user;
      const { key, subSectionKey } = inputs;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }
      if (!campaign[subSectionKey]) {
        return exits.success({
          message: 'deleted',
        });
      }
      if (!campaign[subSectionKey][key]) {
        return exits.success({
          message: 'deleted',
        });
      }
      delete campaign[subSectionKey][key];

      await Campaign.updateOne({
        slug: campaign.slug,
      }).set({
        data: campaign,
      });

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at campaign/onboarding/ai/delete', e);
      return exits.badRequest({
        message: 'Error deleting aiContent',
        e,
      });
    }
  },
};
