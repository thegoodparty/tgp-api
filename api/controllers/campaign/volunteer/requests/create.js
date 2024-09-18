const {
  sendCampaignRequestEmail,
} = require('../../../../utils/campaign/sendCampaignRequestEmail');

module.exports = {
  friendlyName: 'CreateCampaignTeamRequest',

  description: 'Create request to join a campaign team',

  inputs: {
    candidateEmail: {
      type: 'string',
      required: true,
      isEmail: true,
    },

    role: {
      type: 'string',
      isIn: ['volunteer', 'manager', 'staff'],
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Request was created.',
    },
    error: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { user } = this.req;
    const { candidateEmail, role } = inputs;

    const candidateUser = await sails.helpers.user.byEmail(candidateEmail);
    const campaign = candidateUser
      ? await sails.helpers.campaign.byUser(candidateUser?.id)
      : null;
    try {
      const existingRequest = await CampaignRequests.findOne({
        user: user.id,
        candidateEmail,
        role,
      });

      if (existingRequest) {
        throw new Error('Request to join campaign already exists');
      }

      const campaignRequest = await CampaignRequests.create({
        user: user.id,
        candidateEmail,
        role,
        campaign: campaign?.id || null,
      }).fetch();

      const candidateName = await sails.helpers.user.name(candidateUser);
      const requestorName = await sails.helpers.user.name(user);

      const emailTemplateData = JSON.stringify({
        candidateName,
        requestorName,
      });

      await sendCampaignRequestEmail({
        toEmail: candidateUser.email,
        templateName: 'campaign-manager-request',
        subject: `Your Request to Manage ${candidateName}'s Campaign`,
        emailTemplateData,
      });
      // TODO: send invite email if campaign is demo as well
      // TODO: tokenize links for association
      if (campaign) {
        await sendCampaignRequestEmail({
          toEmail: candidateUser.email,
          templateName: 'candidate-campaign-manager-request',
          subject: `Confirm ${requestorName} as Your Campaign Manager on GoodParty.org`,
          emailTemplateData,
        });
      } else {
        await sendCampaignRequestEmail({
          toEmail: candidateUser.email,
          templateName: 'candidate-join-invite',
          subject: `${requestorName} Has Invited You to Join GoodParty.org!`,
          emailTemplateData,
        });
      }

      return exits.success(campaignRequest);
    } catch (e) {
      console.error('error creating campaign request', e);
      return exits.error(e);
    }
  },
};
