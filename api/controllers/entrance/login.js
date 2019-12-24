/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Login user',

  description:
    'Login user with email and password. Return the user and jwt access token.',

  inputs: {
    phone: {
      description: 'User Phone',
      type: 'string',
      required: true,
    },
    verify: {
      description: 'Should verify phone via sms? ',
      type: 'boolean',
      defaultsTo: true,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Phone Format Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { phone, verify } = inputs;
      const phoneError = !/^\d{10}$/.test(phone);

      if (phoneError) {
        return exits.badRequest({
          message: 'Accepting 10 digits phone numbers only. EX: 3104445566',
        });
      }
      const user = await User.findOne({ phone }).populate('congDistrict');
      // .populate('houseDistrict')
      // .populate('senateDistrict');
      if (!user) {
        return exits.badRequest({ message: 'Login Failed' });
      }
      if (verify) {
        await User.updateOne({ id: user.id }).set({
          isPhoneVerified: false,
        });

        // await sails.helpers.passwords.checkPassword(
        //   inputs.password,
        //   user.encryptedPassword,
        // );
        await sails.helpers.smsVerify(`+1${phone}`);
      }
      let token = null;
      if (!verify && user.isPhoneVerified) {
        token = await sails.helpers.jwtSign(user);
      }
      return exits.success({
        user,
        token,
      });
    } catch (err) {
      console.log('login error');
      console.log(err);
      return exits.badRequest({ message: 'Login Failed' });
    }
  },
};
