const setUserCampaignIsPro = async (user, isPro = true) => {
  // TODO: This should be handled in a seperate webhook listener that fires upon successful subscription
  //  creation: https://docs.stripe.com/api/events#:~:text=For%20example%2C%20if%20you%20create%20a%20new%20subscription%20for%20a%20customer%2C%20you%20receive%20both%20a%20customer.subscription.created%20event%20and%20a%20charge.succeeded%20event
  //  https://goodparty.atlassian.net/browse/WEB-2266
  const campaign = await sails.helpers.campaign.byUser(user);
  if (!campaign) {
    return exits.error('Could not fetch campaign');
  }
  await Campaign.updateOne({ id: campaign.id }).set({ isPro });
  return await sails.helpers.campaign.patch(
    campaign.id,
    'details',
    'isProUpdatedAt',
    Date.now(),
  );
};

module.exports = {
  inputs: {},

  exits: {
    success: {
      statusCode: 201,
      description:
        'Successfully created payment portal redirect url and set isPro accordingly',
    },

    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (_, exits) {
    const user = await User.findOne({ id: this.req.user.id });
    const { customerId } = JSON.parse(user.metaData);
    if (!customerId) {
      throw new Error('No customerId found on user');
    }

    const portalSession = await sails.helpers.payments.createPortalSession(
      customerId,
    );

    if (!portalSession) {
      return exits.error('Could not create portal session');
    }

    await setUserCampaignIsPro(user);

    const canDownload = await sails.helpers.campaign.canDownloadVoterFile(
      campaign.id,
    );
    if (!canDownload) {
      // alert Jared and Rob.
      const alertSlackMessage = `<@U01AY0VQFPE> and <@U03RY5HHYQ5>`;
      await sails.helpers.slack.slackHelper(
        {
          title: 'Path To Victory',
          body: `Campaign ${campaign.slug} has been upgraded to Pro but the voter file is not available. Email: ${this.req.user.email}
          visit https://goodparty.org/admin/pro-no-voter-file to see all users without L2 data
          ${alertSlackMessage}
          `,
        },
        'victory-issues',
      );
    }
    return exits.success({
      redirectUrl: portalSession?.url,
    });
  },
};
