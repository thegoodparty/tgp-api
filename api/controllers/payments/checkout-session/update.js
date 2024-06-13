const STRIPE_LIVE_SECRET_KEY = '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';
const STRIPE_TEST_SECRET_KEY = 'sk_test_51P8p2Y1taBPnTqn4aqIDKNaJCfEnsINFkOhBBKanPSWHQXttYZifYn2NYWNcACzUu0JlxlY8TrHUeYCJD93DIgtk006YYVxiT2';
const stripe = require('stripe')(STRIPE_TEST_SECRET_KEY);

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

  fn: async function(inputs, exits) {
    const checkoutSessionId = this.req.param('sessionId');


    if (!checkoutSessionId) {
      return exits.badRequest('sessionId is required');
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);

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
