/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const twilioSID = sails.config.custom.twilioSID || sails.config.twilioSID;
const twilioAuthToken =
  sails.config.custom.twilioAuthToken || sails.config.twilioAuthToken;

module.exports = {
  friendlyName: 'Track Visit',

  inputs: {},

  exits: {
    success: {
      description: 'Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },
  async fn(inputs, exits) {
    try {
      const { MessagingResponse } = require('twilio')(
        twilioSID,
        twilioAuthToken,
      ).twiml;
      const twiml = new MessagingResponse();
      const body = this.req.body.Body;
      const digitsOnly = body?.replace(/\D+/g, '');
      twiml.message(`you responded with ${body}. digits only is ${digitsOnly}`);
      return this.res.set('text/xml').send(twiml.toString());
    } catch (e) {
      console.log('Error at messaging/twilio-webhook', e);
      await sails.helpers.errorLoggerHelper(
        'Error at messaging/twilio-webhook',
        e,
      );
      return exits.badRequest({ message: 'Error at messaging/twilio-webhook' });
    }
  },
};
