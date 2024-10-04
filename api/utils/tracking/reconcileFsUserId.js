const reconcileFsUserId = async (campaign, user) => {
  const { data: campaignData } = campaign || {};
  const { fsUserId: campaignFsUserId, ...restOfCampaignData } =
  campaignData || {};
  const { metaData: metaDataStr } = user || {};
  const userMetaData = JSON.parse(metaDataStr || '{}');

  if (campaignFsUserId) {
    await User.updateOne({ id: user.id }).set({
      metaData: JSON.stringify({
        ...JSON.parse(metaDataStr || '{}'),
        fsUserId: campaignFsUserId,
      }),
    });
    await Campaign.updateOne({ id: campaign.id }).set({
      data: restOfCampaignData,
    });
    return campaignFsUserId;
  }

  return userMetaData?.fsUserId;
};

module.exports = { reconcileFsUserId };
