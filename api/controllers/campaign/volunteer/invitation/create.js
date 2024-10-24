const appBase = sails.config.custom.appBase || sails.config.appBase;
const moment = require('moment');
const {
  sendCampaignRequestEmail,
} = require('../../../../utils/campaign/sendCampaignRequestEmail');

module.exports = {
  inputs: {
    email: {
      type: 'string',
      required: true,
      isEmail: true,
    },
    role: {
      type: 'string',
      isIn: ['volunteer', 'staff', 'manager'],
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
      const { email, role } = inputs;
      const user = this.req.user;
      const campaign = await sails.helpers.campaign.byUser(user.id);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      const lowerCaseEmail = email.toLowerCase();

      const existing = await VolunteerInvitation.findOne({
        email: lowerCaseEmail,
        campaign: campaign.id,
        role,
      });
      if (existing) {
        return exits.badRequest('invitation already exist for this user');
      }

      await VolunteerInvitation.create({
        email: lowerCaseEmail,
        campaign: campaign.id,
        role,
      });

      let name = `${user.firstName} ${user.lastName}`;

      const existingUser = await User.findOne({ email: lowerCaseEmail });
      const nextMonth = moment().add(1, 'month').format('YYYY-MM-DD');
      if (existingUser) {
        await Notification.create({
          isRead: false,
          data: {
            type: 'invitation',
            title: `The campaign for ${name} invited you to volunteer`,
            subTitle: 'Make a difference!',
            link: '/invitations',
            dueDate: nextMonth,
          },
          user: existingUser.id,
        });
      }

      const office =
        campaign.details?.office === 'Other'
          ? campaign.details.otherOffice
          : campaign.details?.office;

      if (role === 'manager') {
        const candidateName = await sails.helpers.user.name(user);
        await sendCampaignRequestEmail({
          toEmail: lowerCaseEmail,
          templateName: 'invite-to-campaign-manager',
          subject: `${candidateName} Has Invited You to Manage Their Campaign on GoodParty.org!`,
          emailTemplateData: {
            campaignManagerName: lowerCaseEmail,
            candidateName,
          },
        });
      } else {
        const variables = {
          base: appBase,
          content: `
        I hope this message finds you well. My name is ${name}, and I am reaching out to you today with a heartfelt request for your support in an endeavor that I believe is crucial for our community.
        <br/><br/>
        As you may know, I am running for ${office} in our upcoming elections. This campaign is more than just a political pursuit; it's a commitment to bring positive change and address the issues that matter most to our community members like you.
        <br/><br/>
        Thank you for considering this request. Your involvement could be a game-changer for our campaign and, more importantly, for our community.
        <br/><br/>
        Warm regards,
        <br/><br/>
        ${name}
        `,
        };

        await sails.helpers.mailgun.mailgunTemplateSender(
          lowerCaseEmail,
          `Join Me in Making a Difference: Volunteer for Our Campaign!`,
          'volunteer-invitation',
          variables,
        );
      }

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
