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
    id: {
      type: 'number',
      required: true,
    },
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
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },
  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const { data, id } = inputs;
      const candidate = await Candidate.findOne({ id });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }

      const candidateIssue = await CampaignNotification.findOrCreate(
        {
          candidate: id,
        },
        {
          candidate: id,
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
