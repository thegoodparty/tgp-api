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
    email: {
      description: 'User Email',
      type: 'string',
      isEmail: true,
    },
    phone: {
      description: 'User Phone',
      type: 'string',
    },
    password: {
      description: 'User Password',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Login Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { email, phone, password } = inputs;
      if (!email && !phone) {
        return exits.badRequest({ message: 'phone or email are required' });
      }
      let user;
      if (email) {
        const lowerCaseEmail = email.toLowerCase();
        user = await User.findOne({ email: lowerCaseEmail });
      } else {
        user = await User.findOne({ phone });
      }
      if (!user) {
        return exits.badRequest({});
      }
      try {
        await sails.helpers.passwords.checkPassword(password, user.password);
      } catch (e) {
        return exits.badRequest({});
      }

      const token = await sails.helpers.jwtSign({
        id: user.id,
        email: lowerCaseEmail,
      });
      return exits.success({ user, token });
    } catch (err) {
      await sails.helpers.errorLoggerHelper('Error at entrance/login', err);
      console.log('login error');
      console.log(err);
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};
