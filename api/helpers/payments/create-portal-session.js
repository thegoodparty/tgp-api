const { stripeSingleton } = require('../../utils/payments/stripeSingleton');
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

  fn: async function (inputs, exits) {
    const { customerId } = inputs;
    if (!customerId) {
      return exits.error('Could not retrieve portal session');
    }

    try {
      const portalSession = await stripeSingleton.billingPortal.sessions.create(
        {
          customer: customerId,
          return_url: `${appBase}/profile`,
        },
      );

      if (!portalSession) {
        throw 'Could not create payment portal session';
      }

      return exits.success(portalSession);
    } catch (error) {
      return exits.error('Could not create payment portal session');
    }
  },
};
