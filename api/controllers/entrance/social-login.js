/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const {
  of,
} = require('@hubspot/api-client/lib/codegen/communication_preferences/rxjsStub');

module.exports = {
  friendlyName: 'Login user',

  description:
    'Login user with email and password. Return the user and jwt access token.',

  inputs: {
    email: {
      description: 'User Phone',
      type: 'string',
      required: true,
      isEmail: true,
    },
    socialPic: {
      description: 'Avatar Image url',
      type: 'string',
      required: false,
    },
    socialToken: {
      description: 'Social Token that needs to be verified',
      type: 'string',
      required: false,
    },
    socialProvider: {
      description: 'Social provider (facebook, google)',
      type: 'string',
      required: false,
    },
    socialId: {
      type: 'string',
      required: false,
      description: 'Social Channel Id',
    },
    name: {
      description: 'User Name',
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
      description: 'Phone Format Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { email, socialPic, socialToken, socialProvider, socialId, name } =
        inputs;
      const lowerCaseEmail = email.toLowerCase();

      try {
        await sails.helpers.verifySocialToken(
          lowerCaseEmail,
          socialToken,
          socialProvider,
        );
      } catch (e) {
        return exits.badRequest({
          message: 'Invalid Token',
        });
      }

      const { domain, userCookieName, tokenCookieName } =
        await sails.helpers.user.getCookieDomain();

      let user = await User.findOne({ email: lowerCaseEmail });
      if (!user) {
        // register
        user = await User.create({
          email: lowerCaseEmail,
          name,
          socialProvider,
          avatar: socialPic,
          isEmailVerified: true,
          socialId,
        }).fetch();

        const token = await sails.helpers.jwtSign({
          id: user.id,
          email: lowerCaseEmail,
        });
        try {
          await sails.helpers.crm.updateUser(user);
        } catch (e) {
          console.log('Error at entrance/social-login', e);
        }

        this.res.cookie(tokenCookieName, token, {
          domain: domain,
          secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS on production
          httpOnly: true, // Ensures the cookie is only accessible via HTTP(S), not JavaScript
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict', // Allows the cookie to be sent with cross-site requests
        });

        this.res.cookie(userCookieName, JSON.stringify(user), {
          domain: domain,
          secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS on production
          httpOnly: false, // We allow frontend to access the user cookie
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
        });

        return exits.success({
          user,
          token,
          newUser: true,
        });
      }
      // login flow
      if (socialPic && !user.avatar) {
        await User.updateOne({ email: lowerCaseEmail }).set({
          avatar: socialPic,
        });
      }

      const token = await sails.helpers.jwtSign({
        id: user.id,
        email: lowerCaseEmail,
      });

      this.res.cookie(tokenCookieName, token, {
        domain: domain,
        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS on production
        httpOnly: true, // Ensures the cookie is only accessible via HTTP(S), not JavaScript
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict', // Allows the cookie to be sent with cross-site requests
      });

      this.res.cookie(userCookieName, JSON.stringify(user), {
        domain: domain,
        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS on production
        httpOnly: false, // We allow frontend to access the user cookie
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
      });

      return exits.success({
        user,
        token,
      });
    } catch (err) {
      console.log('login error');
      console.log(err);
      // await sails.helpers.slack.errorLoggerHelper('Error at entrance/social-login', err);
      return exits.badRequest({
        message: 'Login Error',
      });
    }
  },
};
