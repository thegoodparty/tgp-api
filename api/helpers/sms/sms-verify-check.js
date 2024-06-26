let twilioClient;
module.exports = {
  friendlyName: 'Phone Verification check helper',

  description: 'Phone verification checker helper using twilio API',

  inputs: {
    phone: {
      friendlyName: 'Phone to verify',
      description: 'User Phone Number to verify with sms.',
      type: 'string',
    },
    code: {
      friendlyName: 'User input code',
      description: 'User generated code',
      type: 'string',
    },
  },

  fn: async function (inputs, exits) {
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
      if (cleanPhone.charAt(0) !== 1) {
        cleanPhone = `1${cleanPhone}`;
      }

      const verificationResult = await twilioClient.verify
        .services(twilioVerification)
        .verificationChecks.create({
          to: `+${cleanPhone}`,
          code: inputs.code,
        });

      if (verificationResult.status === 'approved') {
        return exits.success({ message: 'successfully verified phone' });
      } else {
        throw new Error('failed');
      }
    } catch (e) {
      console.log(e);
      throw new Error('failed');
    }
  },
};
