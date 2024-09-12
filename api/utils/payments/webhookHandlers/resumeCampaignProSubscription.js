const { setUserCampaignIsPro } = require('../../campaign/setUserCampaignIsPro');
const { sendProConfirmationEmail } = require('../sendProConfirmationEmail');
const { doVoterDownloadCheck } = require('../../campaign/doVoterDownloadCheck');
const { getUserByCustomerId } = require('../../user/getUserByCustomerId');
const {
  setCampaignSubscriptionId,
} = require('../../campaign/setCampaignSubscriptionId');
const { appEnvironment, PRODUCTION_ENV } = require('../../appEnvironment');

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
  const campaign = await sails.helpers.campaign.byUser(user.id);
  if (!campaign) {
    throw 'No campaign found with given subscriptionId';
  }
  await Promise.allSettled([
    setCampaignSubscriptionId(campaign, subscriptionId),
    setUserCampaignIsPro(campaign),
    sails.helpers.slack.slackHelper(
      {
        title: 'Pro Plan Resumed',
        body: `PRO PLAN RESUMED: \`${name}\` w/ email ${user.email} and campaign slug \`${campaign.slug}\` RESUMED their pro subscription!`,
      },
      appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
    ),
    sendProConfirmationEmail(user, campaign),
    doVoterDownloadCheck(campaign),
  ]);
};

module.exports = {
  resumeCampaignProSubscription,
};
