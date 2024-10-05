const mapCampaignManagementRequests = (campaignManagementRequests = []) =>
  campaignManagementRequests.length ? campaignManagementRequests.reduce(
    (acc, request, i) => ({
      ...acc,
      [`campaign-management-request-${i + 1}`]: request,
    }),
    {},
  ) : null

module.exports = { mapCampaignManagementRequests };
