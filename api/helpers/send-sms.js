let twilioClient;
module.exports = {
  friendlyName: 'Send SMS helper',

  description: 'Send SMS using twilio API',

  inputs: {
    phone: {
      friendlyName: 'Phone to verify',
      description: 'User Phone Number to verify with sms.',
      type: 'string',
    },
    message: {
      friendlyName: 'Message to send',
      description: 'Message to send',
      type: 'string',
    },
  },



  fn: async function(inputs, exits) {
    try {
      const twilioSID = sails.config.custom.twilioSID || sails.config.twilioSID;
      const twilioAuthToken =
        sails.config.custom.twilioAuthToken || sails.config.twilioAuthToken;

      if (!twilioClient) {
        twilioClient = require('twilio')(twilioSID, twilioAuthToken);
      }

      const verification = await twilioClient.messages.create({
        body: inputs.message,
        from: '+17402004839',
        to: inputs.phone,
      });
      if (verification) {
        return exits.success({ sid: verification.sid });
      }
      return exits.badRequest({ message: 'failed to send sms' });
    } catch (e) {
      return exits.badRequest({ message: 'failed to send sms' });
    }
  },
};
