const {
  cancelCampaignProSubscription,
} = require('../../payments/cancelCampaignProSubscription');
const {
  sendProSubscriptionEndingEmail,
} = require('./sendProSubscriptionEndingEmail');
const { stripeSingleton } = require('../../payments/stripeSingleton');

async function handleCancelCampaign(campaign) {
  await cancelCampaignProSubscription(campaign, campaign.user);
  sendProSubscriptionEndingEmail(campaign);
  const { subscriptionId } = campaign.details || {};
  subscriptionId &&
    (await stripeSingleton.subscriptions.cancel(subscriptionId));
}

module.exports = {
  handleCancelCampaign,
};
