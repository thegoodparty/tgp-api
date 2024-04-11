const MIN_ROUTES = 3; // if routes are less than this number, create more routes

// create campaignVolunteer via accepting VolunteerInvitation
module.exports = {
  inputs: {
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
      const { id } = inputs;

      const route = await DoorKnockingRoute.findOne({ id });

      const dkCampaign = await DoorKnockingCampaign.findOne({
        id: route.dkCampaign,
      });

      const campaignVolunteer = await CampaignVolunteer.findOne({
        user: user.id,
        campaign: dkCampaign.campaign,
      });

      if (!campaignVolunteer) {
        return exits.badRequest('You do not have access to this route');
      }

      if (route.volunteer === campaignVolunteer.id) {
        return exits.success({ message: 'claimed' });
      }

      await DoorKnockingRoute.updateOne({ id }).set({
        volunteer: campaignVolunteer.id,
        status: 'claimed',
      });

      await createMoreRoutes(dkCampaign.id);

      return exits.success({
        message: 'claimed',
      });
    } catch (e) {
      console.log('Error at volunteer/routes/get', e);
      return exits.badRequest({ message: 'Error getting routes' });
    }
  },
};

// we need to create 10 more routes if only 3 are left

async function createMoreRoutes(dkCampaignId) {
  const notClaimed = await DoorKnockingRoute.count({
    dkCampaign: dkCampaignId,
    status: 'not-claimed',
  });
  if (notClaimed <= MIN_ROUTES) {
    // see if there are routes that are not calculated
    const notCalculated = await DoorKnockingRoute.find({
      dkCampaign: dkCampaignId,
      status: 'not-calculated',
    }).limit(10);

    if (notCalculated.length > 0) {
      // there are routes that are not calculated, we can just calculate them
      for (let i = 0; i < notCalculated.length; i++) {
        const route = notCalculated[i];
        if (route.data.groupedRoute) {
          const calculatedRoute =
            await sails.helpers.geocoding.generateOptimizedRoute(
              route.data.groupedRoute,
            );
          if (calculatedRoute) {
            await DoorKnockingRoute.updateOne({ id: route.id }).set({
              data: calculatedRoute,
              status: 'not-claimed',
            });
          }
        }
      }
    }
  }
}
