const {
  getCampaignBySubscriptionId,
} = require('../../campaign/getCampaignBySubscriptionId');
const {
  cancelCampaignProSubscription,
} = require('../cancelCampaignProSubscription');
const { getUserByCustomerId } = require('../../user/getUserByCustomerId');

const getCampaignByCustomerId = async (customerId) => {
  const user = await getUserByCustomerId(customerId);
  if (!user) {
    throw 'No user found with given customerId';
  }
  return await sails.helpers.campaign.byUser(user);
};

const endCampaignProSubscription = async (event) => {
  const subscription = event.data.object;
  const { id: subscriptionId, customer: customerId } = subscription;
  if (!subscriptionId) {
    throw 'No subscriptionId found in subscription';
  }

  let campaign =
    (await getCampaignBySubscriptionId(subscriptionId)) ||
    (await getCampaignByCustomerId(customerId));
  if (!campaign) {
    throw 'No campaign found with given subscription';
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
