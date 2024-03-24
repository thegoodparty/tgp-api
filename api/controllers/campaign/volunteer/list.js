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
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      const volunteers = await CampaignVolunteer.find({
        campaign: campaign.id,
      }).populate('user');

      const users = [];
      volunteers.forEach((volunteer) => {
        if (volunteer.user) {
          users.push({
            email: volunteer.user.email,
            phone: volunteer.user.phone,
            firstName: volunteer.user.firstName,
            lastName: volunteer.user.lastName,
            id: volunteer.user.id,
            role: volunteer.role,
          });
        }
      });

      return exits.success({
        volunteers: users,
      });
    } catch (e) {
      console.log('Error listing volunteers', e);
      return exits.badRequest({ message: 'Error listing volunteers.' });
    }
  },
};
