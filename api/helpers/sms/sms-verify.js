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

  fn: async function(inputs, exits) {
    try {
      const twilioSID = sails.config.custom.twilioSID || sails.config.twilioSID;
      const twilioAuthToken =
        sails.config.custom.twilioAuthToken || sails.config.twilioAuthToken;
      const twilioVerification =
        sails.config.custom.twilioVerification ||
        sails.config.twilioVerification;

      if (!twilioClient) {
        twilioClient = require('twilio')(twilioSID, twilioAuthToken);
      }
      let cleanPhone = inputs.phone;
      if (cleanPhone.charAt(0) !== '1') {
        cleanPhone = `1${cleanPhone}`;
      }

      const verification = await twilioClient.verify
        .services(twilioVerification)
        .verifications.create({ to: `+${cleanPhone}`, channel: 'sms' });
      if (verification) {
        return exits.success({ sid: verification.sid });
      }
      throw new Error({ message: 'failed to send sms' });
    } catch (e) {
      throw e;
    }
  },
};
