const {
  getCampaignBySubscriptionId,
} = require('../../campaign/getCampaignBySubscriptionId');
const {
  setCampaignSubscriptionId,
} = require('../../campaign/setCampaignSubscriptionId');
const { setUserCampaignIsPro } = require('../../campaign/setUserCampaignIsPro');
const { appEnvironment, PRODUCTION_ENV } = require('../../appEnvironment');

const endCampaignProSubscription = async (event) => {
  const subscription = event.data.object;
  const { id: subscriptionId } = subscription;
  if (!subscriptionId) {
    throw 'No subscriptionId found in subscription';
  }

  const campaign = await getCampaignBySubscriptionId(subscriptionId);
  if (!campaign) {
    throw 'No campaign found with given subscriptionId';
  }

  const user = await User.findOne({ id: campaign.user });
  if (!user) {
    throw 'No user found with given campaign user id';
  }
  const name = `${user.firstName}${user.firstName ? ` ${user.lastName}` : ''}`;
  await Promise.allSettled([
    setCampaignSubscriptionId(campaign, null),
    setUserCampaignIsPro(campaign, false),
    sails.helpers.slack.slackHelper(
      {
        title: 'Pro Plan Cancellation',
        body: `PRO PLAN CANCELLATION: \`${name}\` w/ email ${user.email} and campaign slug \`${campaign.slug}\` ended their pro subscription!`,
      },
      appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
    ),
  ]);
};

module.exports = {
  endCampaignProSubscription,
};
