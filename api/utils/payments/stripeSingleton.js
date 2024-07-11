const stripe = require('stripe')(
  sails.config.custom.stripeSecretKey || sails.config.stripeSecretKey,
);

module.exports = {
  stripeSingleton: stripe,
};
