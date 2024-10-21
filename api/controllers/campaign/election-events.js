const {
  sendDayAfterPrimaryEmail,
} = require('../../utils/campaign/event-handlers/sendDayAfterPrimaryEmail');
const {
  findActionNeededCampaigns,
} = require('../../utils/campaign/event-handlers/findActionNeededCampaigns');
const {
  handleCancelCampaign,
} = require('../../utils/campaign/event-handlers/handleCancelCampaign');

module.exports = {
  friendlyName:
    'Update Campaigns based on date of elections and send messages to users',
  exits: {
    success: {
      description: 'Campaign Events Handled',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
    serverError: {
      description: 'There was a problem on the server.',
    },
  },
  fn: async function (_, exits) {
    try {
      const campaigns = await Campaign.find({ isPro: true }).populate('user');
      const { afterPrimaryEmailCampaigns, cancelCampaigns } =
        findActionNeededCampaigns(campaigns);
      for (let campaign of afterPrimaryEmailCampaigns) {
        await sendDayAfterPrimaryEmail(campaign);
      }
      for (let campaign of cancelCampaigns) {
        await handleCancelCampaign(campaign, true);
      }

      return exits.success({
        message: 'ok',
      });
    } catch (error) {
      console.error('Error in election-events cron', error);
      return exits.serverError(error);
    }
  },
};
