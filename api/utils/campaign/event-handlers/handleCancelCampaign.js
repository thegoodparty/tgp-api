const {
  cancelCampaignProSubscription,
} = require('../../payments/cancelCampaignProSubscription');
const {
  sendProSubscriptionEndingEmail,
} = require('./sendProSubscriptionEndingEmail');
const { stripeSingleton } = require('../../payments/stripeSingleton');

async function handleCancelCampaign(campaign) {
  const { subscriptionId } = campaign.details || {};
  subscriptionId &&
    (await stripeSingleton.subscriptions.cancel(subscriptionId));
  await cancelCampaignProSubscription(campaign, campaign.user);
  await sendProSubscriptionEndingEmail(campaign);
}

module.exports = {
  handleCancelCampaign,
};
