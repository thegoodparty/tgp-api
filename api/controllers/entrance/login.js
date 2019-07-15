/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {

  friendlyName: 'Login user',

  description: 'Login user with email and password. Return the user and jwt access token.',

  inputs: {
    email: {
      description: 'User Email',
      type: 'string',
      required: true
    },
    password: {
      description: 'User Password',
      type: 'string',
      required: true
    }
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok'
    },
    forbidden: {
      description: 'Login Failed',
      responseType: 'forbidden'
    }
  },

  fn: async function (inputs, exits) {
    try {
      const user = await User.findOne({email: inputs.email});
      await sails.helpers.passwords.checkPassword(inputs.password, user.encryptedPassword);

      if (!user) {
        return exits.forbidden();
      }
      const token = await sails.helpers.jwtSign(user);
      return exits.success({
        user,
        token
      });
    } catch (err) {
      return exits.forbidden();
    }
  }
};
