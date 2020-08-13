/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
const LoginWithTwitter = require('login-with-twitter');
const Twitter = require('twitter-lite');

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
      const consumerKey =
        sails.config.custom.twitterApiKey || sails.config.twitterApiKey;
      const consumerSecret =
        sails.config.custom.twitterSecretKey || sails.config.twitterSecretKey;

      const client = new Twitter({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        include_email: true,
      });

      const res = await client.getAccessToken({
        oauth_verifier: oauthVerifier,
        oauth_token: oauthToken,
      });

      const client2 = new Twitter({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
        access_token_key: res.oauth_token,
        access_token_secret: res.oauth_token_secret,
      });

      const credentials = await client2.get('account/verify_credentials', {
        include_email: true,
        skip_status: true,
        include_entities: true,
      });
      console.log('results2', credentials);
      const user = {
        email: credentials.email,
        name: credentials.name,
        image: credentials.profile_image_url_https
          ? credentials.profile_image_url_https.replace('_normal', '')
          : '',
        accessTokenKey: res.oauth_token,
        accessTokenSecret: res.oauth_token_secret,
      };
      console.log(user);

      /*
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

          console.log('user', user);

          const client = new Twitter({
            consumer_key: consumerKey, // from Twitter.
            consumer_secret: consumerSecret, // from Twitter.
            access_token_key: oauthToken, // from your User (oauth_token)
            access_token_secret: tokenSecret, // from your User (oauth_token_secret)
            include_email: true,
          });

          client
            .get('account/verify_credentials')
            .then(results => {
              console.log('results', results);
            })
            .catch(console.error);
        },
      );
      */
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
