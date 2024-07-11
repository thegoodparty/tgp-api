const { appEnvironment, PRODUCTION_ENV } = require('../appEnvironment');
const doVoterDownloadCheck = async ({ id: campaignId, slug: campaignSlug }) => {
  const canDownload = await sails.helpers.campaign.canDownloadVoterFile(
    campaignId,
  );
  if (!canDownload) {
    // alert Jared and Rob.
    const alertSlackMessage = `<@U01AY0VQFPE> and <@U03RY5HHYQ5>`;
    await sails.helpers.slack.slackHelper(
      {
        title: 'Path To Victory',
        body: `Campaign ${campaignSlug} has been upgraded to Pro but the voter file is not available. Email: ${this.req.user.email}
          visit https://goodparty.org/admin/pro-no-voter-file to see all users without L2 data
          ${alertSlackMessage}
          `,
      },
      appEnvironment === PRODUCTION_ENV ? 'politics' : 'dev',
    );
  }
};

module.exports = {
  doVoterDownloadCheck,
};
