const createCandidatePosition = async ({
  campaign,
  positionId,
  topIssueId,
  description,
  order,
}) => {
  const newPosition = await CandidatePosition.create({
    description,
    campaign: campaign.id,
    position: positionId,
    topIssue: topIssueId,
    order,
  }).fetch();
  // update the many-to-many relationships
  await Campaign.addToCollection(campaign.id, 'positions', positionId);
  await Campaign.addToCollection(campaign.id, 'topIssues', topIssueId);

  await sails.helpers.crm.updateCampaign(campaign);

  return newPosition;
};

module.exports = {
  createCandidatePosition,
};
