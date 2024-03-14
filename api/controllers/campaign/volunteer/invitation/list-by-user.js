module.exports = {
  inputs: {},

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

      const invitations = await VolunteerInvitation.find({
        email: user.email,
      }).populate('campaign');
      invitations.forEach((invitation) => {
        invitation.campaign = {
          ...invitation.campaign.data.details,
          ...invitation.campaign.data.goals,
        };
      });

      return exits.success({
        invitations,
      });
    } catch (e) {
      console.log('Error listing volunteers', e);
      return exits.badRequest({ message: 'Error listing volunteers.' });
    }
  },
};
