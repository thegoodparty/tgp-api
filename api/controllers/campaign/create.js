const { findSlug } = require('../../utils/campaign/findSlug');
const { createCrmUser } = require('../../utils/campaign/createCrmUser');

const claimExistingCampaignRequests = async (user, campaign) => {
  const campaignRequests = await Requests.find({
    candidateEmail: user.email,
  });

  if (campaignRequests?.length) {
    for (const campaignRequest of campaignRequests) {
      await Requests.updateOne({
        id: campaignRequest.id,
      }).set({
        campaign: campaign.id,
      });
    }
  }
};

module.exports = {
  inputs: {},

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
      const { user } = this.req;
      const userName = await sails.helpers.user.name(user);
      if (userName === '') {
        console.log('No user name');
        return exits.badRequest('No user name');
      }

      const slug = await findSlug(userName);
      const data = {
        slug,
        currentStep: 'registration',
      };

      // see if the user already have campaign
      const existing = await sails.helpers.campaign.byUser(user.id);
      if (existing) {
        return exits.success({
          slug: existing.slug,
        });
      }

      const newCampaign = await Campaign.create({
        slug,
        data,
        isActive: false,
        user: user.id,
        details: {
          zip: user.zip,
        },
      }).fetch();

      await claimExistingCampaignRequests(user, newCampaign);
      await createCrmUser(user.firstName, user.lastName, user.email);

      return exits.success({
        slug,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
