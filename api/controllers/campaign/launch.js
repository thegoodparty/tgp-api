// Admin endpoint

const {
  sendCampaignLaunchEmail,
} = require('../../utils/campaign/event-handlers/sendCampaignLaunchEmail');
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  friendlyName: 'Admin launch Campaign',

  inputs: {},

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;

      let campaignRecord = await sails.helpers.campaign.byUser(user);

      if (!campaignRecord) {
        return exits.forbidden();
      }

      const campaignData = campaignRecord.data;

      if (campaignRecord.isActive || campaignData.launchStatus === 'launched') {
        return exits.success({ message: 'already launched' });
      }

      // check if the user has office or otherOffice
      const { details } = campaignRecord;
      if (
        (!details.office || details.office === '') &&
        (!details.otherOffice || details.otherOffice === '')
      ) {
        return exits.forbidden({ message: 'office not set' });
      }

      const updated = await Campaign.updateOne({ id: campaignRecord.id }).set({
        isActive: true,
        data: {
          ...campaignData,
          launchStatus: 'launched',
          currentStep: 'onboarding-complete',
        },
      });

      await sails.helpers.campaign.linkCandidateCampaign(campaignRecord.id);

      await sails.helpers.crm.updateCampaign(updated);
      await sails.helpers.fullstory.customAttr(updated.id);

      await sendCampaignLaunchEmail(campaignRecord.slug);

      return exits.success({
        message: 'created',
        slug: campaignRecord.slug,
      });
    } catch (e) {
      console.log('Error at campaign launch', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at campaign launch',
        e,
      );
      return exits.forbidden();
    }
  },
};
