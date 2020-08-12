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

  inputs: {
    uuid: {
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

  fn: async function(inputs, exits) {
    try {
      const { uuid } = inputs;
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const returnUrl = `${appBase}/twitter-callback`;
      const tw = new LoginWithTwitter({
        consumerKey:
          sails.config.custom.twitterApiKey || sails.config.twitterApiKey,
        consumerSecret:
          sails.config.custom.twitterSecretKey || sails.config.twitterSecretKey,
        callbackUrl: returnUrl,
        withEmail: true
      });

      tw.login(async (err, tokenSecret, url) => {
        if (err) {
          // Handle the error your way
          console.log('error', err);
          await sails.helpers.errorLoggerHelper(
            'Error at entrance/twitter-login',
            err,
          );
          return exits.badRequest({
            message: 'Twitter Login Error',
          });
        }
        const key = `twitter-token-${uuid}`;
        // save token to the keyValue table
        await KeyValue.findOrCreate(
          { key },
          {
            key,
            value: tokenSecret,
          },
        );
        await KeyValue.updateOne({ key }).set({ value: tokenSecret });

        return exits.success({
          url,
        });
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
