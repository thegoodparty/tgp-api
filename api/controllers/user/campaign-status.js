/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const slugify = require('slugify');

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
      const now = new Date();
      await Campaign.updateOne({ slug: campaign.slug }).set({
        data: { ...campaign, lastVisited: now.getTime() },
      });
      if (campaign.candidateSlug) {
        return exits.success({
          status: 'candidate',
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
