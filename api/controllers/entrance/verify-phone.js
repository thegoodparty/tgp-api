module.exports = {
  friendlyName: 'Verify Phone',

  description: 'Verify phone number via code sent to number',

  inputs: {
    phone: {
      type: 'string',
      required: true,
      maxLength: 11,
      example: '3101234567',
    },
    code: {
      description: '6 digits code sent by twilio',
      example: '123456',
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Phone number verified',
    },

    badRequest: {
      description: 'Error verifying phone',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const reqUser = await User.findOne({ phone: inputs.phone });
      const { code } = inputs;
      if (!code || code.length !== 6) {
        return exits.badRequest({
          message: 'Missing 6 digits code',
        });
      }
      await sails.helpers.smsVerifyCheck(`+1${reqUser.phone}`, code);

      await User.updateOne({ id: reqUser.id }).set({
        isPhoneVerified: true,
      });

      const user = await User.findOne({ id: reqUser.id })
        .populate('congressionalDistrict')
        .populate('houseDistrict')
        .populate('senateDistrict');

      const token = await sails.helpers.jwtSign(user);

      return exits.success({
        user,
        token,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error verifying phone',
      });
    }
  },
};
