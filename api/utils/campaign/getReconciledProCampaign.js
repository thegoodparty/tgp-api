const {
  getCampaignBySubscriptionId,
} = require('./getCampaignBySubscriptionId');
const { getCampaignByCustomerId } = require('./getCampaignByCustomerId');

const getReconciledProCampaign = async (subscriptionId, customerId) =>
  (await getCampaignBySubscriptionId(subscriptionId)) ||
  (await getCampaignByCustomerId(customerId));

module.exports = {
  getReconciledProCampaign,
};
