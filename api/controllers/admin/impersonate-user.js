const jwt = require('jsonwebtoken');
module.exports = {
  friendlyName: 'Impersonate user',

  description:
    'Impersonate user with email and admin token. Return the user and jwt access token.',

  inputs: {
    email: {
      description: 'User Email',
      type: 'string',
      isEmail: true,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Impersonate Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { email } = inputs;

      // get the impersonateUser object by email.
      let impersonateUser = await User.findOne({ email });
      if (!impersonateUser) {
        return exits.badRequest({
          message: 'invalid user',
        });
      }

      // get a valid token for impersonateUser
      const token = await sails.helpers.jwtSign({
        id: impersonateUser.id,
        email: impersonateUser.email,
      });

      return exits.success({ user: impersonateUser, token });
    } catch (err) {
      await sails.helpers.errorLoggerHelper('Error at admin/impersonate', err);
      console.log('impersonate error');
      console.log(err);
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};
