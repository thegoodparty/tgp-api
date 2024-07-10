const { patchUserMetaData } = require('../../user/patchUserMetaData');
const {
  setCampaignSubscriptionId,
} = require('../../campaign/setCampaignSubscriptionId');
const { setUserCampaignIsPro } = require('../../campaign/setUserCampaignIsPro');
const { sendProConfirmationEmail } = require('../sendProConfirmationEmail');
const { doVoterDownloadCheck } = require('../../campaign/doVoterDownloadCheck');
const checkoutSessionCompletedEventHandler = async (event) => {
  const session = event.data.object;
  const { customer: customerId, subscription: subscriptionId } = session;
  if (!customerId) {
    throw 'No customerId found in checkout session';
  }

  const { userId } = session.metadata;
  if (!userId) {
    throw 'No userId found in checkout session metadata';
  }

  const user = await User.findOne({ id: userId });
  if (!user) {
    throw 'No user found with given checkout session userId';
  }
  const campaign = await sails.helpers.campaign.byUser(user);
  await Promise.allSettled([
    patchUserMetaData(user, { customerId, checkoutSession: null }),
    setCampaignSubscriptionId(campaign, subscriptionId),
    setUserCampaignIsPro(campaign),
    sendProConfirmationEmail(user, campaign),
    doVoterDownloadCheck(campaign),
  ]);
};

module.exports = {
  checkoutSessionCompletedEventHandler,
};
