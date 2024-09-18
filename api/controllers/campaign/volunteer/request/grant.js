const {
  sendCampaignRequestEmail,
} = require('../../../../utils/campaign/sendCampaignRequestEmail');
module.exports = {
  friendlyName: 'UpdateCampaignTeamRequest',

  description: 'Update a request to join a campaign team',

  inputs: {},

  exits: {
    success: {
      description: 'Campaign Request was updated.',
    },
    error: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { params, user: candidateUser } = this.req;
    const campaign = await sails.helpers.campaign.byUser(candidateUser.id);
    const { requestId } = params || {};

    if (!campaign) {
      throw new Error('No campaign found for authenticated user');
    }

    try {
      const { user: requestorUser, role } = await CampaignRequest.findOne({
        id: requestId,
        campaign: campaign.id,
      }).populate('user');

      const existingVolunteer = await CampaignVolunteer.findOne({
        user: requestorUser.id,
        campaign: campaign.id,
      });

      if (existingVolunteer) {
        throw new Error(
          `Team member for given campaign already exists: ${JSON.stringify(
            existingVolunteer,
          )}`,
        );
      }

      await CampaignVolunteer.create({
        user: requestorUser.id,
        campaign: campaign.id,
        role,
      });

      await CampaignRequest.destroy({
        id: requestId,
      });

      const candidateName = await sails.helpers.user.name(candidateUser);
      const requestorName = await sails.helpers.user.name(requestorUser);
      const emailTemplateData = JSON.stringify({
        candidateName,
        requestorName,
      });

      await sendCampaignRequestEmail({
        toEmail: candidateUser.email,
        templateName: 'campaign-manager-approved',
        subject: `Your Request to Manage ${candidateName}’s Campaign Has Been Approved!`,
        emailTemplateData,
      });

      return exits.success({
        message: 'Campaign Request granted successfully',
      });
    } catch (e) {
      console.error('error updating campaign request', e);
      return exits.error(e);
    }
  },
};
