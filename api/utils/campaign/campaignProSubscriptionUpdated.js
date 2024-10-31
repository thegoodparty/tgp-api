const {
  sendCancellationRequestConfirmationEmail,
} = require('./event-handlers/sendCancellationRequestConfirmationEmail');
const { getReconciledProCampaign } = require('./getReconciledProCampaign');

const campaignProSubscriptionUpdated = async (event) => {
  const subscription = event.data.object;
  const {
    id: subscriptionId,
    customer: customerId,
    canceled_at: canceledAt,
    cancel_at: cancelAt,
  } = subscription;
  if (!subscriptionId) {
    throw 'No subscriptionId found in subscription';
  }

  const campaign = await getReconciledProCampaign(subscriptionId, customerId);
  if (!campaign) {
    throw 'No campaign found with given subscription';
  }

  const user = await User.findOne({ id: campaign.user });

  const { details } = campaign;
  const isCancellationRequest = canceledAt && !details.subscriptionCanceledAt;

  await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'subscriptionCanceledAt',
    canceledAt,
  );
  await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'subscriptionCancelAt',
    cancelAt,
  );
  isCancellationRequest &&
    sendCancellationRequestConfirmationEmail({
      ...(await getReconciledProCampaign(subscriptionId, customerId)),
      user,
    });
};

module.exports = {
  campaignProSubscriptionUpdated,
};
