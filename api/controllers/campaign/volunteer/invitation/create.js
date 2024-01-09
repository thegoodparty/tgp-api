module.exports = {
  inputs: {
    email: {
      type: 'string',
      required: true,
      isEmail: true,
    },
  },

  exits: {
    success: {
      description: 'Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { email } = inputs;
      const user = this.req.user;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      const existing = await VolunteerInvitation.findOne({
        email,
        campaign: campaign.id,
      });
      if (existing) {
        return exits.badRequest('invitation already exist for this user');
      }

      await VolunteerInvitation.create({
        email,
        campaign: campaign.id,
        status: 'pending',
      });

      const invitations = await VolunteerInvitation.find({
        campaign: campaign.id,
      });

      return exits.success({
        invitations,
      });
    } catch (e) {
      console.log('Error inviting volunteer', e);
      return exits.badRequest({ message: 'Error inviting volunteer.' });
    }
  },
};
