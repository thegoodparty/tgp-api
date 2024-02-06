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
      const campaignRecord = await sails.helpers.campaign.byUser(user);
      if (!campaignRecord) {
        return exits.success({
          status: false,
        });
      }

      const campaign = campaignRecord.data;

      await Campaign.updateOne({ slug: campaign.slug }).set({
        data: { ...campaign, lastVisited: timestamp },
      });
      if (campaignRecord.isActive) {
        return exits.success({
          status: 'candidate',
          profile: campaign.slug,
          pathToVictory: campaign.pathToVictory ? 'Complete' : 'Waiting',
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
