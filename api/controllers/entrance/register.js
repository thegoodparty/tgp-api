/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'register user',

  description: 'register a user with email, password first and last name',

  inputs: {
    phone: {
      description: 'User Phone',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'User Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'register Failed',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    // Look up the user whose ID was specified in the request.
    // Note that we don't have to validate that `userId` is a number;
    // the machine runner does this for us and returns `badRequest`
    // if validation fails.

    const { phone } = inputs;
    const phoneError = !/^\d{10}$/.test(phone);

    if (phoneError) {
      return exits.badRequest({
        message: 'Accepting 10 digits phone numbers only. EX: 3104445566',
      });
    }
    try {
      const user = await User.create({
        phone,
      }).fetch();
      const token = await sails.helpers.jwtSign(user);
      // send sms to the newly created user.

      await sails.helpers.smsVerify(`+1${phone}`);
      return exits.success({
        user,
        token,
      });
    } catch (e) {
      console.log(e);
      if(e.code === 'E_UNIQUE'){
        return exits.badRequest({ message: 'This phone is already pledged. Try logging in instead of pledging.' });
      }else {
        return exits.badRequest({ message: 'Error registering phone.' });
      }

    }
  },
};
