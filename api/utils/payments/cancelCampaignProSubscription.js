const {
  setCampaignSubscriptionId,
} = require('../campaign/setCampaignSubscriptionId');
const { setUserCampaignIsPro } = require('../campaign/setUserCampaignIsPro');
const { appEnvironment, PRODUCTION_ENV } = require('../appEnvironment');

const cancelCampaignProSubscription = async function (campaign, user) {
  const name = await sails.helpers.user.name(user);
  console.log(`cancelCampaignProSubscription...`);
  await setCampaignSubscriptionId(campaign, null);
  await setUserCampaignIsPro(campaign, false);
  await sails.helpers.slack.slackHelper(
    {
      title: 'Pro Plan Cancellation',
      body: `PRO PLAN CANCELLATION: \`${name}\` w/ email ${user.email} and campaign slug \`${campaign.slug}\` ended their pro subscription!`,
    },
    appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
  );
};

module.exports = {
  cancelCampaignProSubscription,
};
