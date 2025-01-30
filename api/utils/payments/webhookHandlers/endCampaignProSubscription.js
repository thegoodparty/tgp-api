const {
  persistCampaignProCancellation,
} = require('../persistCampaignProCancellation');
const {
  getReconciledProCampaign,
} = require('../../campaign/getReconciledProCampaign');
const {
  sendProSubscriptionEndingEmail,
} = require('../../campaign/event-handlers/sendProSubscriptionEndingEmail');

const endCampaignProSubscription = async (event) => {
  const subscription = event.data.object;
  const { id: subscriptionId, customer: customerId } = subscription;
  if (!subscriptionId) {
    throw 'No subscriptionId found in subscription';
  }

  const campaign = await getReconciledProCampaign(subscriptionId, customerId);

  if (!campaign) {
    throw 'No campaign found with given subscription';
  }
  const { details } = campaign;

  const user = await User.findOne({ id: campaign.user });
  if (!user) {
    throw 'No user found with given campaign user id';
  }
  const metaData = JSON.parse(user.metaData || '{}');
  if (metaData.isDeleted) {
    console.log('User is already deleted');
    return;
  }
  await persistCampaignProCancellation(
    campaign,
    user,
    Boolean(details.endOfElectionSubscriptionCanceled),
  );
  sendProSubscriptionEndingEmail({ ...campaign, user });

  await sails.helpers.crm.updateCampaign(campaign);
};

module.exports = {
  endCampaignProSubscription,
};
