const { setUserCampaignIsPro } = require('../../campaign/setUserCampaignIsPro');
const { sendProConfirmationEmail } = require('../sendProConfirmationEmail');
const { doVoterDownloadCheck } = require('../../campaign/doVoterDownloadCheck');
const { getUserByCustomerId } = require('../../user/getUserByCustomerId');
const {
  setCampaignSubscriptionId,
} = require('../../campaign/setCampaignSubscriptionId');

const resumeCampaignProSubscription = async (event) => {
  const subscription = event.data.object;
  const { customer: customerId, id: subscriptionId } = subscription;
  if (!customerId) {
    throw 'No customerId found in subscription';
  }

  const user = await getUserByCustomerId(customerId);
  if (!user) {
    throw 'No user found with given subscription customerId';
  }
  const campaign = await sails.helpers.campaign.byUser(user);
  if (!campaign) {
    throw 'No campaign found with given subscriptionId';
  }
  await Promise.allSettled([
    setCampaignSubscriptionId(campaign, subscriptionId),
    setUserCampaignIsPro(campaign),
    sendProConfirmationEmail(user, campaign),
    doVoterDownloadCheck(campaign),
  ]);
};

module.exports = {
  resumeCampaignProSubscription,
};
