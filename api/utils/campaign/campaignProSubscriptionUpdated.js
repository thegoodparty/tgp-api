const {
  getCampaignBySubscriptionId,
} = require('./getCampaignBySubscriptionId');
const { getCampaignByCustomerId } = require('./getCampaignByCustomerId');

const campaignProSubscriptionUpdated = async (event) => {
  const subscription = event.data.object;
  const {
    id: subscriptionId,
    customer: customerId,
    canceled_at: canceledAt,
    cancel_at: cancelAt,
  } = subscription;
  if (!subscriptionId) {
    throw 'No subscriptionId found in subscription';
  }

  let campaign =
    (await getCampaignBySubscriptionId(subscriptionId)) ||
    (await getCampaignByCustomerId(customerId));
  if (!campaign) {
    throw 'No campaign found with given subscription';
  }

  await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'subscriptionCanceledAt',
    canceledAt,
  );
  await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'subscriptionCancelAt',
    cancelAt,
  );
};

module.exports = {
  campaignProSubscriptionUpdated,
};
