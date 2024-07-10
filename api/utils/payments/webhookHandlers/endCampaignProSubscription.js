const {
  getCampaignBySubscriptionId,
} = require('../../campaign/getCampaignBySubscriptionId');
const {
  setCampaignSubscriptionId,
} = require('../../campaign/setCampaignSubscriptionId');
const { setUserCampaignIsPro } = require('../../campaign/setUserCampaignIsPro');
const endCampaignProSubscription = async (event) => {
  const subscription = event.data.object;
  const { id: subscriptionId } = subscription;
  if (!subscriptionId) {
    throw 'No subscriptionId found in subscription';
  }
  const campaign = await getCampaignBySubscriptionId(subscriptionId);
  if (!campaign) {
    throw 'No campaign found with given subscriptionId';
  }

  await Promise.allSettled([
    setCampaignSubscriptionId(campaign, null),
    setUserCampaignIsPro(campaign, false),
  ]);
};

module.exports = {
  endCampaignProSubscription,
};
