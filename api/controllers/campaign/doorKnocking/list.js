// create campaignVolunteer via accepting VolunteerInvitation
module.exports = {
  inputs: {},

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
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const campaigns = await DoorKnockingCampaign.find({
        campaign: campaign.id,
      }).populate('routes', {
        where: { status: { '!=': 'not-calculated' } },
      });

      const dkCampaigns = campaigns.map((campaign) => {
        let firstBounds = false;
        if (
          campaign.routes?.length > 0 &&
          campaign.routes[0].data?.response?.routes?.length > 0
        ) {
          firstBounds = campaign.routes[0].data?.response?.routes[0].bounds;
        }
        return {
          ...campaign.data,
          hasRoutes: campaign.routes?.length > 0,
          bounds: firstBounds,
          routesCount: campaign.routes?.length || 0,
          status: campaign.status,
        };
      });

      dkCampaigns.sort((a, b) => {
        const aStartDate = new Date(a.startDate);
        const bStartDate = new Date(b.startDate);
        return aStartDate - bStartDate;
      });

      return exits.success({
        dkCampaigns,
      });
    } catch (e) {
      console.log('Error at doorKnocking/create', e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
