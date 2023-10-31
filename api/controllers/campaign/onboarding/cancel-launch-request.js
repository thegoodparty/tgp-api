/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Campaigns.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  friendlyName: 'Cancel launch request (admin)',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Request Cancelled',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error cancelling',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { slug } = inputs;

      const campaign = await Campaign.findOne({
        slug,
      });

      if (!campaign || !campaign.data) {
        console.log('no campaign');
        return exits.badRequest({ message: 'no campaign', slug });
      }

      if (campaign.data.launchStatus === 'pending') {
        const updated = campaign.data;
        delete updated.launchStatus;
        await Campaign.updateOne({ slug }).set({
          data: updated,
        });
        return exits.success({
          message: 'Cancelled',
        });
      }
      return exits.badRequest({
        message: 'wrong status',
        status: campaign.launchStatus,
      });
    } catch (e) {
      console.log('Error cancelling launch request', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error cancelling launch request',
        e,
      );
      return exits.badRequest('error', e);
    }
  },
};
