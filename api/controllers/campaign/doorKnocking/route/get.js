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
      let route = await DoorKnockingRoute.findOne({
        id,
        dkCampaign: dkCampaign.id,
        status: { '!=': 'not-calculated' },
      }).populate('volunteer');

      if (!route) {
        return exits.badRequest('No campaign');
      }

      ({ route } = await sails.helpers.doorKnocking.routeStatus(route, true));

      const campaignVolunteer = await CampaignVolunteer.findOne({
        user: user.id,
        campaign: campaign.id,
      });
      console.log('campaignVolunteer', campaignVolunteer);
      console.log('route.volunteer', route.volunteer);
      if (campaignVolunteer) {
        route.claimedByUser = campaignVolunteer.id === route.volunteer?.id;
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
