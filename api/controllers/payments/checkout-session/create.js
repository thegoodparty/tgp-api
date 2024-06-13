const STRIPE_LIVE_SECRET_KEY = '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';
const STRIPE_TEST_SECRET_KEY = 'sk_test_51P8p2Y1taBPnTqn4aqIDKNaJCfEnsINFkOhBBKanPSWHQXttYZifYn2NYWNcACzUu0JlxlY8TrHUeYCJD93DIgtk006YYVxiT2';
const stripe = require('stripe')(STRIPE_TEST_SECRET_KEY);

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {},

  exits: {
    success: {
      statusCode: 201,
      description: 'Successfully created checkout session and redirect url',
    },

    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    const prices = await stripe.prices.list();

    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [
        {
          // We should never have more than 1 price for Pro. But if we do, this
          //  will need to be more intelligent.
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appBase}/dashboard/pro-sign-up/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBase}/dashboard`,
    });

    const {
      url: redirectUrl,
    } = session;

    return exits.success({
      redirectUrl,
    });
  },
};
