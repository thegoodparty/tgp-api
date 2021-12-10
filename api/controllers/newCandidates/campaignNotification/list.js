/**
 * newCandidates/candidateIssue/list.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Find Campaign Notification',

  description: 'Candidate Manager endpoint to find Campaign Notification',

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
      const campaignNotifications = await CampaignNotification.find().populate('candidate');
      return exits.success({
        campaignNotifications,
      });

    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate content.' });
    }
  },
};
