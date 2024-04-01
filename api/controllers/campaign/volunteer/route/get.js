// create campaignVolunteer via accepting VolunteerInvitation
module.exports = {
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    dkSlug: {
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
      const { id, dkSlug } = inputs;

      let route = await DoorKnockingRoute.findOne({ id }).populate('volunteer');

      if (route.volunteer.user === user.id) {
        // set the status of each address based on the voter survey
        route = await sails.helpers.doorKnocking.routeStatus(route);
        route.claimedByUser = true;
        return exits.success({ route });
      }

      const dkCampaign = await DoorKnockingCampaign.findOne({
        id: route.dkCampaign,
        slug: dkSlug,
      });
      if (!dkCampaign) {
        await sails.helpers.slack.errorLoggerHelper(
          'error at volunteer/route/get.',
          { message: 'You do not have access to this route', dkCampaign },
        );
        return exits.badRequest('You do not have access to this route.');
      }

      const campaignVolunteer = await CampaignVolunteer.findOne({
        user: user.id,
        campaign: dkCampaign.campaign,
      });

      route.claimedByUser = campaignVolunteer.id === route.volunteer;

      return exits.success({
        route,
      });
    } catch (e) {
      console.log('Error at volunteer/routes/get', e);
      return exits.badRequest({ message: 'Error getting routes' });
    }
  },
};
