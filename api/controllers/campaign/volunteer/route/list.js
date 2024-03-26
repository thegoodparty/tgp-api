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
      }).populate('routes');

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
      dkCampaigns.forEach((dkCampaign) => {
        dkCampaign.routes.forEach((route) => {
          const { optimizedAddresses } = route.data;
          if (optimizedAddresses && optimizedAddresses.length > 0) {
            if (!route.volunteer) {
              route.type = dkCampaign.data.type;
              nonClaimedRoutes.push(route);
            }
            if (route.volunteer === user.id) {
              route.type = dkCampaign.data.type;
              claimedRoutes.push(route);
            }
          }
        });
      });

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
