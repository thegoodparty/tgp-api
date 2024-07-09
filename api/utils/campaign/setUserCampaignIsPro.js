const setUserCampaignIsPro = async (campaign, isPro = true) => {
  await Campaign.updateOne({ id: campaign.id }).set({ isPro });
  return await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'isProUpdatedAt',
    Date.now(),
  );
};

module.exports = {
  setUserCampaignIsPro,
};
