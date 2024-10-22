const {
  cancelCampaignProSubscription,
} = require('../../payments/cancelCampaignProSubscription');
const {
  sendProSubscriptionEndingEmail,
} = require('./sendProSubscriptionEndingEmail');
const { stripeSingleton } = require('../../payments/stripeSingleton');

async function handleCancelCampaign(campaign, autoCancel = false) {
  await cancelCampaignProSubscription(campaign, campaign.user, autoCancel);
  sendProSubscriptionEndingEmail(campaign);
  const { subscriptionId } = campaign.details || {};
  subscriptionId &&
    (await stripeSingleton.subscriptions.cancel(subscriptionId));
}

module.exports = {
  handleCancelCampaign,
};
