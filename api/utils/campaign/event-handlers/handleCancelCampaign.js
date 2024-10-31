const { stripeSingleton } = require('../../payments/stripeSingleton');

async function handleCancelCampaign(
  campaign,
  endOfElectionSubscriptionCanceled = false,
) {
  const { subscriptionId } = campaign.details || {};
  subscriptionId &&
    (await stripeSingleton.subscriptions.cancel(subscriptionId));
  await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'endOfElectionSubscriptionCanceled',
    endOfElectionSubscriptionCanceled,
  );
}

module.exports = {
  handleCancelCampaign,
};
