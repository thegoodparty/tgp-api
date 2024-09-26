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
    conflict: {
      description: 'conflict',
      responseType: 'conflict',
      responseCode: 409,
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
      const existingRequest = await CampaignRequest.findOne({
        user: user.id,
        candidateEmail,
        role,
      });

      if (existingRequest) {
        return exits.conflict({
          message: `An request to join campaign already exists`,
          exists: true,
        });
      }

      const campaignRequest = await CampaignRequest.create({
        user: user.id,
        candidateEmail,
        role,
        campaign: campaign?.id || null,
      }).fetch();

      const candidateName =
        (await sails.helpers.user.name(candidateUser)) || candidateEmail;
      const requestorName = await sails.helpers.user.name(user);

      const emailTemplateData = JSON.stringify({
        candidateName,
        requestorName,
      });

      await sendCampaignRequestEmail({
        toEmail: user.email,
        templateName: 'campaign-manager-request',
        subject: `Your Request to Manage ${candidateName}'s Campaign`,
        emailTemplateData,
      });

      if (campaign && !campaign?.isDemo) {
        await sendCampaignRequestEmail({
          toEmail: candidateUser.email,
          templateName: 'candidate-campaign-manager-request',
          subject: `Confirm ${requestorName} as Your Campaign Manager on GoodParty.org`,
          emailTemplateData,
        });

        candidateUser &&
          (await Notification.create({
            isRead: false,
            data: {
              type: 'campaignRequest',
              title: `${requestorName} has requested to manage your campaign`,
              subTitle: 'You have a request!',
              link: '/dashboard/team',
            },
            user: candidateUser.id,
          }));
      } else {
        await sendCampaignRequestEmail({
          toEmail: candidateEmail,
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
