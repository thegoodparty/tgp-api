/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

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
      const { metaData } = user;
      const now = new Date();
      const timestamp = now.getTime();
      let updated = metaData ? JSON.parse(metaData) : {};
      updated = {
        ...updated,
        lastVisited: timestamp,
      };

      await User.updateOne({ id: user.id }).set({
        metaData: JSON.stringify(updated),
      });

      // see if the user already have campaign
      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }
      if (!campaign) {
        return exits.success({
          status: false,
        });
      }
      await Campaign.updateOne({ slug: campaign.slug }).set({
        data: { ...campaign, lastVisited: timestamp },
      });
      if (campaign.candidateSlug) {
        return exits.success({
          status: 'candidate',
          profile: campaign.candidateSlug,
        });
      }
      return exits.success({
        status: 'onboarding',
        slug: campaign.slug,
      });
    } catch (e) {
      console.log('error at campaign status', e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
