const setUserCampaignIsPro = async (campaign, isPro = true) => {
  await Promise.allSettled([
    Campaign.updateOne({ id: campaign.id }).set({ isPro }),
    sails.helpers.campaign.patch(
      campaign.id,
      'details',
      'isProUpdatedAt',
      Date.now(),
    ),
  ]);
};

module.exports = {
  setUserCampaignIsPro,
};