/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
const request = require('request-promise');
const LoginWithTwitter = require('login-with-twitter');
const get = require('simple-get');

module.exports = {
  friendlyName: 'Login user',

  description:
    'Login user with email and password. Return the user and jwt access token.',

  inputs: {
    uuid: {
      type: 'string',
      required: true,
    },
    oauthToken: {
      type: 'string',
      required: true,
    },
    oauthVerifier: {
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
      const { uuid, oauthToken, oauthVerifier } = inputs;
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const returnUrl = `${appBase}/twitter-callback`;
      const tw = new LoginWithTwitter({
        consumerKey:
          sails.config.custom.twitterApiKey || sails.config.twitterApiKey,
        consumerSecret:
          sails.config.custom.twitterSecretKey || sails.config.twitterSecretKey,
        callbackUrl: returnUrl,
      });

      const key = `twitter-token-${uuid}`;
      const tokenSecret = await KeyValue.findOne({ key });

      tw.callback(
        {
          oauth_token: oauthToken,
          oauth_verifier: oauthVerifier,
        },
        tokenSecret.value,
        async (err, user) => {
          if (err) {
            // Handle the error your way
            console.log(err);
          }

          // Delete the tokenSecret securely

          // The user object contains 4 key/value pairs, which
          // you should store and use as you need, e.g. with your
          // own calls to Twitter's API, or a Twitter API module
          // like `twitter` or `twit`.
          // user = {
          //   userId,
          //   userName,
          //   userToken,
          //   userTokenSecret
          // }
          console.log('user', user);

          // call get credentials to get email and image
          // https://developer.twitter.com/en/docs/accounts-and-users/manage-account-settings/api-reference/get-account-verify_credentials
          const requestData = {
            url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
            method: 'GET',
            data: {
              oauth_token: oauthToken,
              oauth_token_secret: tokenSecret,
              include_entities: true,
              include_email: true,
            },
          };

          get.concat(
            {
              url: requestData.url,
              method: requestData.method,
              form: requestData.data,
              headers: tw._oauth.toHeader(tw._oauth.authorize(requestData)),
            },
            (err, res, data) => {
              // console.log('err', err);
              // console.log('res', res);
              res.pipe(process.stdout)
              return exits.success({
                user: user,
              });
            },
          );
          // const userWithCredentials = await request({
          //   ...requestData,
          //   headers: tw._oauth.toHeader(tw._oauth.authorize(requestData)),
          //   form: requestData.data,
          // });
        },
      );
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
