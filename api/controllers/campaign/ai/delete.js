module.exports = {
  friendlyName: 'Delete aiContent',

  inputs: {
    key: {
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
      const { key } = inputs;

      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign.aiContent) {
        return exits.success({
          message: 'deleted',
        });
      }
      if (!campaign.aiContent[key]) {
        return exits.success({
          message: 'deleted',
        });
      }
      delete campaign.aiContent[key];
      delete campaign.aiContent.generationStatus[key];

      await Campaign.updateOne({
        slug: campaign.slug,
      }).set({
        aiContent: campaign.aiContent,
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
