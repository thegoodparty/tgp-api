const stripe = require('stripe')(
  sails.config.custom.stripeSecretKey || sails.config.stripeSecretKey,
);

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

  fn: async function (inputs, exits) {
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

    const { url: redirectUrl } = session;

    return exits.success({
      redirectUrl,
    });
  },
};
