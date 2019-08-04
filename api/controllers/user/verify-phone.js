module.exports = {
  friendlyName: 'Verify Phone',

  description: 'Verify phone number via code sent to number',

  inputs: {
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
      const reqUser = this.req.user;
      const { code } = inputs;
      if (!code || code.length !== 6) {
        return exits.badRequest({
          message: 'Missing 6 digits code',
        });
      }
      console.log('reqUser.phone', reqUser.phone);
      await sails.helpers.smsVerifyCheck(`+1${reqUser.phone}`, code);

      await User.updateOne({ id: reqUser.id }).set({
        isPhoneVerified: true,
      });

      const user = await User.findOne({ id: reqUser.id })
        .populate('congressionalDistrict')
        .populate('houseDistrict')
        .populate('senateDistrict');

      return exits.success({
        user,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error verifying phone',
      });
    }
  },
};
