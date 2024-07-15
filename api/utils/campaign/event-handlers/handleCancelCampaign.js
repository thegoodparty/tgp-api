const {
  cancelCampaignProSubscription,
} = require('../../payments/cancelCampaignProSubscription');
const {
  sendProSubscriptionEndingEmail,
} = require('./sendProSubscriptionEndingEmail');

async function handleCancelCampaign(campaign) {
  await cancelCampaignProSubscription(campaign, campaign.user);
  await sendProSubscriptionEndingEmail(campaign);
}

module.exports = {
  handleCancelCampaign,
};
