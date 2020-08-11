/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
const request = require('request-promise');
const LoginWithTwitter = require('login-with-twitter');

module.exports = {
  friendlyName: 'Login user',

  description:
    'Login user with email and password. Return the user and jwt access token.',

  inputs: {},

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
      const returnUrl = 'https://dev.thegoodparty.org/twitter-callback';
      const tw = new LoginWithTwitter({
        consumerKey:
          sails.config.custom.twitterApiKey || sails.config.twitterApiKey,
        consumerSecret:
          sails.config.custom.twitterSecretKey || sails.config.twitterSecretKey,
        callbackUrl: returnUrl,
      });

      tw.login((err, tokenSecret, url) => {
        console.log(err);
        console.log(tokenSecret);
        console.log(url);
        if (err) {
          // Handle the error your way
          console.log('error');
        }
      });
      return exits.success({
        m: 'm',
      });
    } catch (err) {
      console.log('twitter login error');
      console.log(err);
      await sails.helpers.errorLoggerHelper(
        'Error at entrance/twitter-login',
        e,
      );
      return exits.badRequest({
        message: 'Twitter Login Error',
      });
    }
  },
};
