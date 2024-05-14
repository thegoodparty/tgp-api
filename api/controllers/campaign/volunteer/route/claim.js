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

      console.log('user', user);

      const route = await DoorKnockingRoute.findOne({ id });
      console.log('route', route);

      const dkCampaign = await DoorKnockingCampaign.findOne({
        id: route.dkCampaign,
      });
      console.log('dkCampaign', dkCampaign);

      let campaignVolunteer = await CampaignVolunteer.findOne({
        user: user.id,
        campaign: dkCampaign.campaign,
      });

      console.log('campaignVolunteer', campaignVolunteer);

      if (!campaignVolunteer) {
        console.log('No campaign volunteer');
        // check if the campaign user is the req user. of so create a volunteer for the user
        const campaign = await Campaign.findOne({ id: dkCampaign.campaign });
        if (campaign.user === user.id) {
          campaignVolunteer = await CampaignVolunteer.create({
            role: 'candidate',
            campaign: campaign.id,
            user: user.id,
          }).fetch();
        } else {
          return exits.badRequest('You do not have access to this route');
        }
      }

      if (route.volunteer === campaignVolunteer.id) {
        return exits.success({ message: 'claimed' });
      }

      await DoorKnockingRoute.updateOne({ id }).set({
        volunteer: campaignVolunteer.id,
        status: 'claimed',
      });

      await createMoreRoutes(dkCampaign);

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

async function createMoreRoutes(dkCampaign) {
  const notClaimed = await DoorKnockingRoute.count({
    dkCampaign: dkCampaign.id,
    status: 'not-claimed',
  });
  if (notClaimed <= MIN_ROUTES) {
    console.log('calculating more');
    // see if there are routes that are not calculated
    const notCalculated = await DoorKnockingRoute.find({
      dkCampaign: dkCampaign.id,
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
      await sails.helpers.slack.errorLoggerHelper('Created more routes', {
        count: notCalculated.length,
      });
    }
    if (notCalculated.length < 10) {
      // create more routes.
      const queueMessage = {
        type: 'calculateDkRoutes',
        data: {
          campaignId: dkCampaign.campaign,
          dkCampaignId: dkCampaign.id,
          maxHousesPerRoute: dkCampaign.data.maxHousesPerRoute,
        },
      };
      await sails.helpers.queue.enqueue(queueMessage);
      await sails.helpers.queue.consumer();
    }
  }
}
