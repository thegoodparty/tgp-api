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
      console.log('slug', slug);

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
      dkCampaigns.forEach((dkCampaign) => {
        dkCampaign.routes.forEach((route) => {
          if (!route.volunteer || route.volunteer === user.id) {
            route.type = dkCampaign.data.type;
            nonClaimedRoutes.push(route);
          }
        });
      });

      console.log('nonClaimedRoutes', nonClaimedRoutes);

      return exits.success({
        routes: nonClaimedRoutes,
      });
    } catch (e) {
      console.log('Error at volunteer/routes/get', e);
      return exits.badRequest({ message: 'Error getting routes' });
    }
  },
};
