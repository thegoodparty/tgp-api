const { patchUserMetaData } = require('../../../utils/user/patchUserMetaData');
const { stripeSingleton } = require('../../../utils/payments/stripeSingleton');
const stripeKey =
  sails.config.custom.stripeSecretKey || sails.config.stripeSecretKey;

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
    const product = await stripeSingleton.products.retrieve(
      stripeKey?.includes('live')
        ? 'prod_QCGFVVUhD6q2Jo'
        : 'prod_QAR4xrqUhyHHqX',
    );
    const { default_price: price } = product;

    const session = await stripeSingleton.checkout.sessions.create({
      metadata: {
        userId: this.req.user.id,
      },
      billing_address_collection: 'auto',
      line_items: [
        {
          // We should never have more than 1 price for Pro. But if we do, this
          //  will need to be more intelligent.
          price,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appBase}/dashboard/pro-sign-up/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: this.req.headers.referer || `${appBase}/dashboard`,
    });

    const { url: redirectUrl, id: checkoutSessionId } = session;

    await patchUserMetaData(this.req.user, { checkoutSessionId });

    return exits.success({
      redirectUrl,
    });
  },
};
