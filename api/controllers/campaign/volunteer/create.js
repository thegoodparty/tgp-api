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
      const { id } = inputs;

      const user = this.req.user;
      const invitation = await VolunteerInvitation.findOne({
        email: user.email,
        id,
      });
      if (!invitation) {
        return exits.badRequest('No invitation');
      }

      await CampaignVolunteer.create({
        role: invitation.role,
        campaign: invitation.campaign,
        user: user.id,
      });

      await VolunteerInvitation.destroyOne({ id });

      return exits.success({
        message: 'accepted',
      });
    } catch (e) {
      console.log('Error accepting invitation', e);
      return exits.badRequest({ message: 'Error accepting invitation.' });
    }
  },
};
