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
      const campaign = await sails.helpers.campaign.byUser(user.id);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      const volunteers = await CampaignVolunteer.find({
        campaign: campaign.id,
      }).populate('user');

      return exits.success({
        volunteers: volunteers.map((volunteer) => {
          const { user } = volunteer;
          const { email, phone, firstName, lastName, id } = user;
          return {
            ...volunteer,
            user: { email, phone, firstName, lastName, id },
          };
        }),
      });
    } catch (e) {
      console.log('Error listing volunteers', e);
      return exits.badRequest({ message: 'Error listing volunteers.' });
    }
  },
};
