module.exports = {
  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    slug: {
      type: 'string',
      required: true,
    },
    endDate: {
      type: 'string',
      required: true,
    },
    startDate: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { name, endDate, startDate, slug } = inputs;

      const user = this.req.user;

      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      const dkCampaign = await DoorKnockingCampaign.findOne({
        slug,
        campaign: campaign.id,
      });
      await DoorKnockingCampaign.updateOne({ id: dkCampaign.id }).set({
        data: {
          ...dkCampaign.data,
          name,
          endDate,
          startDate,
        },
      });

      return exits.success({
        slug,
      });
    } catch (e) {
      console.log('Error at doorKnocking/create', e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
