const { userIsCampaignManager } = require('./userIsCampaignManager');
const userCanMutateCampaignVolunteer = async (userId, campaignVolunteerId) => {
  const campaignVolunteer = await CampaignVolunteer.findOne({
    id: campaignVolunteerId,
  }).populate('campaign');

  if (!campaignVolunteer) {
    console.error(`Campaign volunteer not found => ${campaignVolunteerId}`);
    return false;
  }

  const { campaign } = campaignVolunteer;

  const authenticatedUserIsCampaignManager = await userIsCampaignManager(
    userId,
    campaign.id,
  );
  const authenticatedUserIsCampaignCandidate = userId === campaign.user;

  return (
    authenticatedUserIsCampaignCandidate || authenticatedUserIsCampaignManager
  );
};

module.exports = {
  userCanMutateCampaignVolunteer,
};
