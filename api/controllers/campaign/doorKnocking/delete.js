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
      description: 'deleted',
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
      await DoorKnockingRoute.destroy({ dkCampaign: dkCampaign.id });
      await DoorKnockingVoter.destroy({ dkCampaign: dkCampaign.id });

      await DoorKnockingCampaign.destroyOne({ id: dkCampaign.id });

      return exits.success({
        message: 'Campaign deleted',
      });
    } catch (e) {
      console.log('Error at doorKnocking/delete', e);
      return exits.badRequest({ message: 'Error deleting campaign.' });
    }
  },
};
