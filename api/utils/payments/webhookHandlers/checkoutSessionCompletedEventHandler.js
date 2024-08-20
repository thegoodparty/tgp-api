const { patchUserMetaData } = require('../../user/patchUserMetaData');
const {
  setCampaignSubscriptionId,
} = require('../../campaign/setCampaignSubscriptionId');
const { setUserCampaignIsPro } = require('../../campaign/setUserCampaignIsPro');
const { sendProConfirmationEmail } = require('../sendProConfirmationEmail');
const { doVoterDownloadCheck } = require('../../campaign/doVoterDownloadCheck');
const {
  sendProSignUpSlackMessage,
} = require('../../campaign/sendProSignUpSlackMessage');

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
  if (!campaign) {
    throw 'No campaign found for user';
  }

  await Promise.allSettled([
    patchUserMetaData(user, { customerId, checkoutSessionId: null }),
    setCampaignSubscriptionId(campaign, subscriptionId),
    setUserCampaignIsPro(campaign),
    sendProSignUpSlackMessage(user, campaign),
    sendProConfirmationEmail(user, campaign),
    doVoterDownloadCheck(campaign),
  ]);
};

module.exports = {
  checkoutSessionCompletedEventHandler,
};
