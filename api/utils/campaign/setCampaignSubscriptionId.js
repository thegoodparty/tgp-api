const setCampaignSubscriptionId = async (campaign, subscriptionId) => {
  return await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'subscriptionId',
    subscriptionId,
  );
};

module.exports = {
  setCampaignSubscriptionId,
};
