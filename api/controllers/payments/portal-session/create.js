const stripe = require('stripe')(
  sails.config.custom.stripeSecretKey ||
  sails.config.stripeSecretKey
);

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {},

  exits: {
    success: {
      statusCode: 201,
      description: 'Successfully created payment portal redirect url and set isPro accordingly',
    },

    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function(_, exits) {
    const user = await User.findOne({ id: this.req.user.id });
    const { customerId } = JSON.parse(user.metaData);
    if (!customerId) {
      throw new Error('No customerId found on user');
    }

    const portalSession = await sails.helpers.payments.createPortalSession(customerId);

    if (!portalSession) {
      return exits.error('Could not create portal session');
    }

    // TODO: This should be handled in a seperate webhook listener that fires upon successful subscription
    //  creation: https://docs.stripe.com/api/events#:~:text=For%20example%2C%20if%20you%20create%20a%20new%20subscription%20for%20a%20customer%2C%20you%20receive%20both%20a%20customer.subscription.created%20event%20and%20a%20charge.succeeded%20event
    //  https://goodparty.atlassian.net/browse/WEB-2266
    const campaign = await Campaign.findOne({ user: this.req.user.id });
    if (!campaign) {
      return exits.error('Could not fetch campaign');
    }
    await Campaign.updateOne({ id: campaign.id }).set({ isPro: true });
    return exits.success({
      redirectUrl: portalSession?.url,
    });
  },
};
