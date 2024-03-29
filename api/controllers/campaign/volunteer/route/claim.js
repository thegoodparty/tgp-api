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

      return exits.success({
        message: 'claimed',
      });
    } catch (e) {
      console.log('Error at volunteer/routes/get', e);
      return exits.badRequest({ message: 'Error getting routes' });
    }
  },
};
