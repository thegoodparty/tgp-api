const { patchUserMetaData } = require('../../user/patchUserMetaData');
const {
  setCampaignSubscriptionId,
} = require('../../campaign/setCampaignSubscriptionId');
const { setUserCampaignIsPro } = require('../../campaign/setUserCampaignIsPro');
const { sendProConfirmationEmail } = require('../sendProConfirmationEmail');
const { doVoterDownloadCheck } = require('../../campaign/doVoterDownloadCheck');
const { appEnvironment, PRODUCTION_ENV } = require('../../appEnvironment');
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
  const name = `${user.firstName}${user.firstName ? ` ${user.lastName}` : ''}`;
  await Promise.allSettled([
    patchUserMetaData(user, { customerId, checkoutSessionId: null }),
    setCampaignSubscriptionId(campaign, subscriptionId),
    setUserCampaignIsPro(campaign),
    sails.helpers.slack.slackHelper(
      {
        title: 'New Pro User!',
        body: `PRO PLAN SIGN UP:\`${name}\` w/ email ${user.email} and campaign slug \`${campaign.slug}\` has signed up for a pro subscription!`,
      },
      appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
    ),
    sendProConfirmationEmail(user, campaign),
    doVoterDownloadCheck(campaign),
  ]);
};

module.exports = {
  checkoutSessionCompletedEventHandler,
};
