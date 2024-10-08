const getUserCRMType = async (user, campaign) => {
  const type = [
    Boolean(!campaign || campaign?.role === 'manager') ? 'User' : 'Campaign',
  ];
  const campaignManagerRequests = await CampaignRequest.find({
    user: user.id,
    role: 'manager',
  });
  const campaignManagerRecord =
    campaign &&
    (await CampaignVolunteer.findOne({
      campaign: campaign.id,
      user: user.id,
    }));

  if (campaignManagerRequests?.length) {
    type.push('Requested Campaign Manager');
  }
  if (campaignManagerRecord) {
    type.push('Approved Campaign Manager');
  }

  return type.join(';');
};

module.exports = { getUserCRMType };
