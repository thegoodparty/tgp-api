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

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'sms verification failed.',
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

      const verificationResult = await twilioClient.verify
        .services(twilioVerification)
        .verificationChecks.create({ to: inputs.phone, code: inputs.code });

      console.log(verificationResult);
      if (verificationResult.status === 'approved') {
        return exits.success({message: 'successfully verified phone'});
      } else {
        return exits.badRequest({ message: 'failed to send sms' });
      }
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'failed to send sms' });
    }
  },
};
