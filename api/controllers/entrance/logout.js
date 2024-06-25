/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Logout user',

  description: 'Logout the signed in user.',

  inputs: {},

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Logout Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { domain, userCookieName, tokenCookieName } =
        await sails.helpers.user.getCookieDomain();

      this.res.cookie(tokenCookieName, '', {
        domain: domain,
        expires: new Date(0), // Set the cookie to expire immediately
        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS on production
        httpOnly: true, // Ensures the cookie is only accessible via HTTP(S), not JavaScript
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict', // Allows the cookie to be sent with cross-site requests
      });

      this.res.cookie(userCookieName, '', {
        domain: domain,
        expires: new Date(0), // Set the cookie to expire immediately
        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is only sent over HTTPS on production
        httpOnly: false, // Ensures the cookie is only accessible via HTTP(S), not JavaScript
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict', // Allows the cookie to be sent with cross-site requests
      });
      return exits.success();
    } catch (e) {
      console.log('error at user/logout');
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error at user/logout', e);
      return exits.badRequest();
    }
  },
};
