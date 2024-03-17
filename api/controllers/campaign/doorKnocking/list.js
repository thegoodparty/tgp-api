// create campaignVolunteer via accepting VolunteerInvitation
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
      console.log('doorKnocking/list');
      const user = this.req.user;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const campaigns = await DoorKnockingCampaign.find({
        campaign: campaign.id,
      });

      const dkCampaigns = campaigns.map((campaign) => campaign.data);

      return exits.success({
        dkCampaigns,
      });
    } catch (e) {
      console.log('Error at doorKnocking/create', e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
