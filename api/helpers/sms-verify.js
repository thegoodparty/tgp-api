let twilioClient;
module.exports = {
  friendlyName: 'Phone Verification helper',

  description: 'Phone verification helper using twilio API',

  inputs: {
    phone: {
      friendlyName: 'Phone to verify',
      description: 'User Phone Number to verify with sms.',
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'sms failed',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const twilioSID = sails.config.custom.twilioSID || sails.config.twilioSID;
      const twilioAuthToken = sails.config.custom.twilioAuthToken || sails.config.twilioAuthToken;
      const twilioVerification = sails.config.custom.twilioVerification || sails.config.twilioVerification;

      if (!twilioClient) {
        twilioClient = require('twilio')(twilioSID, twilioAuthToken);
      }

      const verification = await twilioClient.verify
        .services(twilioVerification)
        .verifications.create({ to: inputs.phone, channel: 'sms' });
      if (verification) {
        console.log('verification.sid', verification);
        return exits.success({ sid: verification.sid });
      }
      return exits.badRequest({ message: 'failed to send sms' });
    } catch (e) {
      return exits.badRequest({ message: 'failed to send sms' });
    }
  },
};
