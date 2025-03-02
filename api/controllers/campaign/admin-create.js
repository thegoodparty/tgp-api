const { findSlug } = require('../../utils/campaign/findSlug');
const { createCrmUser } = require('../../utils/campaign/createCrmUser');
const appBase = sails.config.custom.appBase || sails.config.appBase;

const claimExistingCampaignRequests = async (user, campaign) => {
  const campaignRequests = await CampaignRequest.find({
    candidateEmail: user.email,
  }).populate('user');

  if (campaignRequests?.length) {
    for (const campaignRequest of campaignRequests) {
      const { user } = campaignRequest;

      await CampaignRequest.updateOne({
        id: campaignRequest.id,
      }).set({
        campaign: campaign.id,
      });

      await Notification.create({
        isRead: false,
        data: {
          type: 'campaignRequest',
          title: `${await sails.helpers.user.name(
            user,
          )} has requested to manage your campaign`,
          subTitle: 'You have a request!',
          link: '/dashboard/team',
        },
        user: user.id,
      });
    }
  }
};

module.exports = {
  inputs: {
    firstName: {
      type: 'string',
      required: true,
    },
    lastName: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      required: true,
      isEmail: true,
    },
    zip: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 5,
    },
    phone: {
      type: 'string',
      required: true,
    },
    party: {
      type: 'string',
      required: true,
    },
    otherParty: {
      type: 'string',
    },
    adminEmail: {
      type: 'string'
    }
  },

  exits: {
    success: {
      description: 'Campaign Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
      responseType: 'badRequest',
    },
    emailAlreadyInUse: {
      statusCode: 409,
      description: 'The provided email address is already in use.',
    },
  },
  fn: async function (inputs, exits) {
    try {
      let { firstName, lastName, email, zip, phone, party, otherParty, adminEmail } =
        inputs;
      email = email.toLowerCase();
      const existing = await User.findOne({ email });
      if (existing) {
        return exits.emailAlreadyInUse();
      }
      const userName = `${firstName} ${lastName}`;
      const user = await User.create({
        firstName,
        lastName,
        name: userName,
        email,
        zip,
        phone,
        role: 'campaign',
      }).fetch();

      if (!user) {
        return exits.badRequest({ message: 'Error creating user.' });
      }
      const slug = await findSlug(userName);
      const data = {
        slug,
        currentStep: 'onboarding-complete',
        party,
        otherParty,
        createdBy: 'admin',
        adminUserEmail: adminEmail ?? ''
      };

      const newCampaign = await Campaign.create({
        slug,
        data,
        isActive: true,
        user: user.id,
        details: {
          zip: user.zip,
          knowRun: 'yes',
          pledged: true,
        },
      }).fetch();

      await claimExistingCampaignRequests(user, newCampaign);
      await createCrmUser(firstName, lastName, email);
      await sails.helpers.crm.updateCampaign(newCampaign);
      return exits.success({
        campaign: newCampaign,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
