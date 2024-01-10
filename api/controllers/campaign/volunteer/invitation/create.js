const appBase = sails.config.custom.appBase || sails.config.appBase;
module.exports = {
  inputs: {
    email: {
      type: 'string',
      required: true,
      isEmail: true,
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
      const { email } = inputs;
      const user = this.req.user;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      const existing = await VolunteerInvitation.findOne({
        email,
        campaign: campaign.id,
      });
      if (existing) {
        return exits.badRequest('invitation already exist for this user');
      }

      await VolunteerInvitation.create({
        email,
        campaign: campaign.id,
        status: 'pending',
      });

      let name = '';
      if (campaign?.data?.details) {
        name = `${campaign.data.details.firstName} ${campaign.data.details.lastName}`;
      }
      const office =
        campaign.details?.office === 'Other'
          ? campaign.details.otherOffice
          : campaign.details?.office;

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
        email,
        `Join Me in Making a Difference: Volunteer for Our Campaign!`,
        'volunteer-invitation',
        JSON.stringify(variables),
      );

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
