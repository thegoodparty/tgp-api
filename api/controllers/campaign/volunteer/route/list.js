// create campaignVolunteer via accepting VolunteerInvitation
module.exports = {
  inputs: {
    slug: {
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
      const user = this.req.user;
      const { slug } = inputs;

      const campaign = await Campaign.findOne({
        slug,
      });
      const dkCampaigns = await DoorKnockingCampaign.find({
        where: { campaign: campaign.id, status: 'active' },
      }).populate('routes', { where: { status: { '!=': 'not-calculated' } } });

      if (!dkCampaigns.length === 0) {
        return exits.badRequest('No campaign');
      }

      const campaignVolunteer = await CampaignVolunteer.findOne({
        user: user.id,
        campaign: campaign.id,
      });

      if (!campaignVolunteer) {
        return exits.badRequest('You do not have access to this campaign');
      }

      // we need to filter the routes that are claimed but also include routes that claimed by the user.
      let nonClaimedRoutes = [];
      let claimedRoutes = [];
      for (let i = 0; i < dkCampaigns.length; i++) {
        const dkCampaign = dkCampaigns[i];
        // first we filter campaigns that are not active
        const status = calcCampaignStatus(dkCampaign);
        if (status !== 'active') {
          continue;
        }
        for (let j = 0; j < dkCampaign.routes.length; j++) {
          const route = dkCampaign.routes[j];
          const { optimizedAddresses } = route.data;
          if (optimizedAddresses && optimizedAddresses.length > 0) {
            if (!route.volunteer) {
              route.type = dkCampaign.data.type;
              route.dkCampaignSlug = dkCampaign.slug;
              nonClaimedRoutes.push(route);
            } else {
              const volunteer = await CampaignVolunteer.findOne({
                id: route.volunteer,
              });
              if (volunteer && volunteer.user === user.id) {
                route.type = dkCampaign.data.type;
                route.dkCampaignSlug = dkCampaign.slug;
                claimedRoutes.push(route);
              }
            }
          }
        }
      }

      return exits.success({
        unclaimedRoutes: nonClaimedRoutes,
        claimedRoutes,
      });
    } catch (e) {
      console.log('Error at volunteer/routes/list', e);
      return exits.badRequest({ message: 'Error getting routes' });
    }
  },
};

function calcCampaignStatus(campaign) {
  const campaignData = campaign.data;
  if (campaign.status === 'complete' || campaign.status === 'archived') {
    return campaignData.status;
  }

  const startDate = new Date(campaignData.startDate);
  const endDate = new Date(campaignData.endDate);
  const currentDate = new Date();

  if (currentDate < startDate) {
    return 'upcoming';
  } else if (currentDate > endDate) {
    return 'passed';
  } else {
    return 'active';
  }
}
