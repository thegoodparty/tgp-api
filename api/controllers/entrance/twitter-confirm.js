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

  inputs: {
    oauthToken: {
      type: 'string',
      required: true,
    },
    oauthVerifier: {
      type: 'string',
      required: true,
    },

    guestUuid: {
      description: 'uuid that was generated on the front end',
      type: 'string',
      required: false,
    },

    candidateFollow: {
      description: 'Indicates follow candidate',
      type: 'number',
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
      const { oauthToken, oauthVerifier, candidateFollow } = inputs;
      const consumerKey =
        sails.config.custom.twitterApiKey || sails.config.twitterApiKey;
      const consumerSecret =
        sails.config.custom.twitterSecretKey || sails.config.twitterSecretKey;

      const client = new Twitter({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret,
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
      if (candidateFollow) {
        await twitterFollow(candidateFollow, client2, exits);
        return exits.success({
          message: 'success',
        });
      }

      const credentials = await client2.get('account/verify_credentials', {
        include_email: true,
        skip_status: true,
        include_entities: true,
      });
      const user = {
        email: credentials.email,
        name: credentials.name,
        image: credentials.profile_image_url_https
          ? credentials.profile_image_url_https.replace('_normal', '')
          : null,
        accessTokenKey: res.oauth_token,
        accessTokenSecret: res.oauth_token_secret,
      };

      // if the user exists in our system - log them in.
      // if not - register.
      const userRecord = await User.findOne({ email: user.email });
      if (userRecord) {
        //login
        if (user.image && !userRecord.avatar) {
          await User.updateOne({ id: userRecord.id }).set({
            avatar: user.image,
          });
        }
        const token = await sails.helpers.jwtSign({
          id: userRecord.id,
          email: userRecord.email,
        });

        return exits.success({
          user: userRecord,
          token,
        });
      }
      // register
      const { guestUuid } = inputs;

      const userAttr = {
        email: user.email,
        name: user.name,
        avatar: user.image,
        socialProvider: 'twitter',
      };

      const uuid =
        guestUuid ||
        Math.random()
          .toString(36)
          .substring(2, 12);

      const newUser = await User.create({
        uuid,
        ...userAttr,
      }).fetch();

      const token = await sails.helpers.jwtSign({
        id: newUser.id,
        email: newUser.email,
      });

      return exits.success({
        user: newUser,
        token,
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

const twitterFollow = async (candidateFollow, client, exits) => {
  const candidate = await Candidate.findOne({ id: candidateFollow });
  const data = JSON.parse(candidate.data);
  let { twitter } = data;
  const screenName = twitter
    .replace('https://twitter.com/', '')
    .replace('https://www.twitter.com/', '');

  const credentials = await client.get('account/verify_credentials', {
    skip_status: true,
    include_entities: true,
  });
  const userTwitterId = credentials.id;

  await client.post('friendships/create', {
    screen_name: screenName,
    user_id: userTwitterId,
    follow: true,
  });
};
