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
      required: true,
      isEmail: true,
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
      const { email, password } = inputs;
      const lowerCaseEmail = email.toLowerCase();

      const user = await User.findOne({ email: lowerCaseEmail });
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
