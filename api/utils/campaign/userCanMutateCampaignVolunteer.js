const userCanMutateCampaignVolunteer = async (userId, campaignVolunteerId) => {
  const campaignVolunteer = await CampaignVolunteer.findOne({
    id: campaignVolunteerId,
  }).populate('campaign');

  if (!campaignVolunteer) {
    console.error(`Campaign volunteer not found => ${campaignVolunteerId}`);
    return false;
  }

  const { campaign: volunteerCampaign } = campaignVolunteer;
  const campaign = await sails.helpers.campaign.byUser(userId);

  return Boolean(campaign && volunteerCampaign?.id === campaign.id);
};

module.exports = {
  userCanMutateCampaignVolunteer,
};
