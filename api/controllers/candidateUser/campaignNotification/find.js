/**
 * candidateIssue/find.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Load Campaign Notification',

  description: 'Campaign Notification endpoint to find Campaign Notification',

  inputs: {},

  exits: {
    success: {
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'error finding',
      responseType: 'badRequest',
    },
  },
  async fn(inputs, exits) {
    try {
      const { user } = this.req;

      const campaignNotification = await CampaignNotification.findOne({
        candidate: user.candidate,
      });
      if (campaignNotification) {
        return exits.success({
          campaignNotification,
        });
      } else {
        return exits.success({
          campaignNotification: false,
        });
      }
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate issue.' });
    }
  },
};
