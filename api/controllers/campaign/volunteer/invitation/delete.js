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
      const campaign = await sails.helpers.campaign.byUser(user.id);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const { id } = inputs;

      await VolunteerInvitation.destroyOne({ id, campaign: campaign.id });

      const invitations = await VolunteerInvitation.find({
        campaign: campaign.id,
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
