const STRIPE_LIVE_SECRET_KEY = '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';
const STRIPE_TEST_SECRET_KEY = 'sk_test_51P8p2Y1taBPnTqn4aqIDKNaJCfEnsINFkOhBBKanPSWHQXttYZifYn2NYWNcACzUu0JlxlY8TrHUeYCJD93DIgtk006YYVxiT2';
const stripe = require('stripe')(STRIPE_TEST_SECRET_KEY);

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    customerId: {
      type: 'string',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'Successfully created payment portal session',
    },
  },

  fn: async function(inputs, exits) {
    const { customerId } = inputs;
    if (!customerId) {
      return exits.error('Could not retrieve portal session');
    }

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appBase}/profile`,
      });


      if (!portalSession) {
        throw 'Could not create payment portal session';
      }

      return exits.success(portalSession);
    } catch (error) {
      return exits.error('Could not create payment portal session');
    }
  },
};
