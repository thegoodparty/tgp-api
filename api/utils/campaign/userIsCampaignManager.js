const userIsCampaignManager = async (userId, campaignId) =>
  Boolean(
    await CampaignVolunteer.findOne({
      campaign: campaignId,
      role: 'manager',
      user: userId,
    }),
  );

module.exports = {
  userIsCampaignManager,
};
