const { findSlug } = require('../../utils/campaign/findSlug');
const { createCrmUser } = require('../../utils/campaign/createCrmUser');

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
    },
    phone: {
      type: 'string',
      required: true,
    },
    party: {
      type: 'string',
      required: true,
    },
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
  },
  fn: async function (inputs, exits) {
    try {
      const { firstName, lastName, email, zip, phone, party } = inputs;
      const userName = `${firstName} ${lastName}`;
      const user = await User.create({
        firstName,
        lastName,
        name: userName,
        email,
        zip,
        phone,
        party,
        role: 'campaign',
      }).fetch();

      if (!user) {
        return exits.badRequest({ message: 'Error creating user.' });
      }

      const slug = await findSlug(userName);
      const data = {
        slug,
        currentStep: 'onboarding-complete',
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
      await createCrmUser(user.firstName, user.lastName, user.email);

      return exits.success({
        campaign: newCampaign,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};