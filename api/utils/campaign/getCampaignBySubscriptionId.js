const getCampaignBySubscriptionId = async (subscriptionId) => {
  const rawQuery = `
    SELECT * FROM campaign WHERE details->>'subscriptionId' = '${subscriptionId}';
  `;
  console.log(`rawQuery =>`, rawQuery);
  const { rows = [] } = await sails.getDatastore().sendNativeQuery(rawQuery);
  return rows[0];
};

module.exports = {
  getCampaignBySubscriptionId,
};
