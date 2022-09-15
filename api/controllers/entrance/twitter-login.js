/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
const Twitter = require('twitter-lite');

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
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const returnUrl = `${appBase}/twitter-callback`;

      const consumerKey =
        sails.config.custom.twitterApiKey || sails.config.twitterApiKey;
      const consumerSecret =
        sails.config.custom.twitterSecretKey || sails.config.twitterSecretKey;

      const client = new Twitter({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
      });
      const res = await client.getRequestToken(returnUrl);
      const url = `https://api.twitter.com/oauth/authenticate?oauth_token=${res.oauth_token}`;
      return exits.success({
        url,
      });
    } catch (err) {
      console.log('twitter login error');
      console.log(err);
      await sails.helpers.errorLoggerHelper(
        'Error at entrance/twitter-login',
        err,
      );
      return exits.badRequest({
        message: 'Twitter Login Error',
      });
    }
  },
};
