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
        const { firstName, lastName } = invitation.campaign.data;
        const { city, state, office, otherOffice, party, district } =
          invitation.campaign.data.details;
        invitation.campaign = {
          firstName,
          lastName,
          city,
          state,
          office,
          otherOffice,
          party,
          district,
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
