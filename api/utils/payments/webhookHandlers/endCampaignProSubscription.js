const {
  getCampaignBySubscriptionId,
} = require('../../campaign/getCampaignBySubscriptionId');
const {
  cancelCampaignProSubscription,
} = require('../cancelCampaignProSubscription');

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

  const user = await User.findOne({ id: campaign.user });
  if (!user) {
    throw 'No user found with given campaign user id';
  }
  await cancelCampaignProSubscription(campaign, user);
};

module.exports = {
  endCampaignProSubscription,
};
