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

      const route = await DoorKnockingRoute.findOne({ id }).populate(
        'volunteer',
      );

      if (route.volunteer.user === user.id) {
        // set the status of each address based on the voter survey
        const addresses = route.data.optimizedAddresses;
        let completeCount = 0;
        for (let i = 0; i < addresses.length; i++) {
          const address = addresses[i];
          const survey = await Survey.findOne({
            voter: address.voterId,
            route: route.id,
            volunteer: route.volunteer.id,
          });
          if (survey) {
            if (survey.data?.status === 'completed') {
              completeCount++;
              address.status = 'completed';
            } else {
              address.status = 'in-progress';
            }
          }
        }
        if (completeCount === addresses.length) {
          await DoorKnockingRoute.updateOne({ id }).set({
            status: 'completed',
          });
          route.status = 'completed';
        }
        route.claimedByUser = true;
        return exits.success({ route });
      }

      const dkCampaign = await DoorKnockingCampaign.findOne({
        id: route.dkCampaign,
        slug: dkSlug,
      });
      if (!dkCampaign) {
        return exits.badRequest('You do not have access to this route.');
      }

      const campaignVolunteer = await CampaignVolunteer.findOne({
        user: user.id,
        campaign: dkCampaign.campaign,
      });

      if (!campaignVolunteer) {
        return exits.badRequest('You do not have access to this route');
      }

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
