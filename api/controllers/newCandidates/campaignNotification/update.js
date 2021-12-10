/**
 * campaignNotification/update.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Update Campaign Notification',

  description: 'Campaign Notification endpoint to edit campaign notification',

  inputs: {
    data: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Notification Update',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Campaign Notification update Failed',
      responseType: 'badRequest',
    },
  },
  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const { data } = inputs;
      const candidateIssue = await CampaignNotification.findOrCreate(
        {
          candidate: user.candidate,
        },
        {
          candidate: user.candidate,
        },
      );
      await CampaignNotification.updateOne({
        id: candidateIssue.id,
      }).set({
        ...data,
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error updated Campaign Notification.',
      });
    }
  },
};
