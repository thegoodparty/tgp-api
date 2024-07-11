const { stripeSingleton } = require('../../utils/payments/stripeSingleton');
const {
  resumeCampaignProSubscription,
} = require('../../utils/payments/webhookHandlers/resumeCampaignProSubscription');
const { parseRawBodyAsBuffer } = require('../../utils/parseRawBodyAsBuffer');
const {
  checkoutSessionCompletedEventHandler,
} = require('../../utils/payments/webhookHandlers/checkoutSessionCompletedEventHandler');
const {
  clearCheckoutSession,
} = require('../../utils/payments/webhookHandlers/clearCheckoutSession');
const {
  endCampaignProSubscription,
} = require('../../utils/payments/webhookHandlers/endCampaignProSubscription');

const endpointSecret =
  sails.config.custom.stripeWebSocketSecret ||
  sails.config.stripeWebSocketSecret;

module.exports = {
  inputs: {},
  exits: {
    success: {
      statusCode: 200,
      description: 'Successfully handled stripe event',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (_, exits) {
    const sig = this.req.headers['stripe-signature'];
    const rawBody = await parseRawBodyAsBuffer(this.req);
    let event;
    try {
      event = stripeSingleton.webhooks.constructEvent(
        rawBody,
        sig,
        endpointSecret,
      );
    } catch (err) {
      console.error('Could not parse payment provider webhook event!');
      console.error(err.message);
      return exits.badRequest(err.message);
    }

    console.log(`processing event.type =>`, event.type);
    console.log(`event =>`, JSON.stringify(event));
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await checkoutSessionCompletedEventHandler(event);
          break;
        case 'checkout.session.expired':
          await clearCheckoutSession(event);
          break;
        case 'customer.subscription.deleted':
          await endCampaignProSubscription(event);
          break;
        case 'customer.subscription.resumed':
          await resumeCampaignProSubscription(event);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (e) {
      console.error(
        `Error processing event "${event.type}" w/ id ${event.id}:`,
        e,
      );
      return exits.badRequest('Error processing event');
    }

    return exits.success();
  },
};
