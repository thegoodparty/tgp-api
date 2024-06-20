const stripe = require('stripe')(
  sails.config.custom.stripeSecretKey || sails.config.stripeSecretKey,
);

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Successfully updated checkout session',
    },

    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const checkoutSessionId = this.req.param('sessionId');

    if (!checkoutSessionId) {
      return exits.badRequest('sessionId is required');
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(
      checkoutSessionId,
    );

    if (!checkoutSession?.customer) {
      throw new Error('No customer ID found on checkout session');
    }

    const user = await User.findOne({ id: this.req.user.id });

    const metaData = JSON.parse(user.metaData);
    metaData.customerId = checkoutSession.customer;

    await User.updateOne({
      id: user.id,
    }).set({
      metaData: JSON.stringify(metaData),
    });

    return exits.success();
  },
};
