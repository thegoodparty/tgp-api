const { stat } = require('fs');

// create campaignVolunteer via accepting VolunteerInvitation
module.exports = {
  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'archived',
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
      const { slug } = inputs;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const dkCampaign = await DoorKnockingCampaign.findOne({
        slug,
        campaign: campaign.id,
      });
      await DoorKnockingCampaign.updateOne({ id: dkCampaign.id }).set({
        status: 'archived',
      });

      return exits.success({
        message: 'Campaign archived',
      });
    } catch (e) {
      console.log('Error at doorKnocking/archive', e);
      return exits.badRequest({ message: 'Error archiving campaign.' });
    }
  },
};
