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
      const authorizationHeader = this.req.headers.authorization;

      let bearerToken;
      // get the bearerToken from the request headers.
      if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
        bearerToken = authorizationHeader.substring('Bearer '.length);
      } else {
        return res.status(401).json({ error: 'Invalid authorization header' });
      }

      if (!email && !bearerToken) {
        return exits.badRequest({
          message: 'a valid session and email are required',
        });
      }

      // decode the requesting users' token.
      let userEmail;
      const decodedToken = await jwt.decode(bearerToken);
      if (
        decodedToken &&
        typeof decodedToken === 'object' &&
        decodedToken.data.email !== undefined
      ) {
        userEmail = decodedToken.data.email;
      }

      if (!userEmail) {
        return exits.badRequest({
          message: 'invalid session',
        });
      }

      // ensure the requesting user exists and has admin rights.
      let user = await User.findOne({ email: userEmail, isAdmin: true });
      if (!user) {
        return exits.badRequest({
          message: 'forbidden',
        });
      }

      // get the impersonateUser object by email.
      let impersonateUser = await User.findOne({ email });
      if (!user) {
        return exits.badRequest({
          message: 'forbidden',
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
