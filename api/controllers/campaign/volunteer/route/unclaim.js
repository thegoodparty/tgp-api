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
      const volunteer = await CampaignVolunteer.findOne({ user: user.id });

      if (route.volunteer === volunteer.id) {
        await DoorKnockingRoute.updateOne({ id }).set({
          volunteer: null,
          status: 'not-claimed',
        });
      }

      return exits.success({
        message: 'unclaimed',
      });
    } catch (e) {
      console.log('Error at volunteer/routes/get', e);
      return exits.badRequest({ message: 'Error getting routes' });
    }
  },
};
