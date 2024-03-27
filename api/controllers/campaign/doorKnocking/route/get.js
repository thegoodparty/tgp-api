// create campaignVolunteer via accepting VolunteerInvitation
module.exports = {
  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
    id: {
      type: 'number',
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
      const user = this.req.user;
      const { slug, id } = inputs;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const dkCampaign = await DoorKnockingCampaign.findOne({
        slug,
        campaign: campaign.id,
      });

      if (!dkCampaign) {
        return exits.badRequest('No campaign');
      }
      const route = await DoorKnockingRoute.findOne({
        id,
        dkCampaign: dkCampaign.id,
        status: { '!=': 'not-calculated' },
      });

      if (!route) {
        return exits.badRequest('No campaign');
      }

      return exits.success({
        dkCampaign: dkCampaign.data,
        route,
      });
    } catch (e) {
      console.log('Error at doorKnocking/create', e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
