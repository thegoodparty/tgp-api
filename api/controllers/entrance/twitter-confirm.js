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

    zip: {
      description: 'zip collected from user during account creation.',
      type: 'string',
      required: false,
    },
    ranking: {
      description: 'stringified array of Ranking objects',
      type: 'string',
      required: false,
    },

    referrer: {
      description: 'uuid of the inviting user',
      type: 'string',
      required: false,
    },
    guestUuid: {
      description: 'uuid that was generated on the front end',
      type: 'string',
      required: false,
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
      const { oauthToken, oauthVerifier } = inputs;
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

        const userWithZip = await User.findOne({ id: userRecord.id });

        const zipCode = await ZipCode.findOne({
          id: userWithZip.zipCode,
        }).populate('cds');
        userWithZip.zipCode = zipCode;

        return exits.success({
          user: userWithZip,
          token,
        });
      }
      // register
      // TODO: move to helper and remove the dup code in register and here.
      const { zip, ranking, referrer, guestUuid } = inputs;
      let zipCode;

      if (zip) {
        zipCode = await ZipCode.findOne({ zip });
      }
      const userAttr = {
        email: user.email,
        name: user.name,
        avatar: user.image,
        socialProvider: 'twitter',
      };
      if (zipCode) {
        userAttr.zipCode = zipCode.id;
        userAttr.shortState = zipCode.stateShort;
        // districtId wasn't specified - take the first one in the array
        let districtId;
        let { approxPctArr } = zipCode;
        if (approxPctArr) {
          approxPctArr = JSON.parse(approxPctArr);
          if (approxPctArr.length > 0) {
            districtId = approxPctArr[0].districtId;
            if (districtId) {
              const congDistrict = await CongDistrict.findOne({
                id: districtId,
              });
              userAttr.congDistrict = districtId;
              userAttr.districtNumber = congDistrict.code;
            }
          }
        }
      }
      if (referrer) {
        const referrerUser = await User.findOne({ uuid: referrer });
        if (referrerUser) {
          userAttr.referrer = referrerUser.id;
          await User.updateOne({ id: referrerUser.id }).set({
            crewCount: referrerUser.crewCount ? referrerUser.crewCount + 1 : 2,
          });
        } else {
          // invited by a guest with a referrer (uuid) that was generated on the front end.
          userAttr.guestReferrer = referrer;
        }
      }
      const uuid =
        guestUuid ||
        Math.random()
          .toString(36)
          .substring(2, 12);

      const newUser = await User.create({
        uuid,
        ...userAttr,
      }).fetch();

      // find all the users that were invited by this user
      const referredUsers = await User.find({ guestReferrer: uuid });
      for (let i = 0; i < referredUsers.length; i++) {
        const referredUser = referredUsers[i];
        await User.updateOne({ id: referredUser.id }).set({
          referrer: newUser.id,
          guestReferrer: '',
        });
      }
      //add crewCount from refferedUsers
      if (referredUsers.length > 0) {
        newUser.crewCount = referredUsers.length;
      }
      try {
        // convert the guest ranking (from cookies) to actual ranking in our system.
        if (ranking) {
          const rankingArr = JSON.parse(ranking);
          for (let i = 0; i < rankingArr.length; i++) {
            const { chamber, candidate, isIncumbent, rank } = rankingArr[i];
            await Ranking.create({
              user: newUser.id,
              chamber,
              candidate,
              rank,
              isIncumbent,
              userState: newUser.shortState,
            });
          }
        }
      } catch (e) {
        // do nothing. Usually the error is for missing state.
      }

      const userWithZip = await User.findOne({ id: newUser.id });

      const userZipCode = await ZipCode.findOne({
        id: userWithZip.zipCode,
      }).populate('cds');
      userWithZip.zipCode = userZipCode;
      const token = await sails.helpers.jwtSign({
        id: newUser.id,
        email: newUser.email,
      });

      return exits.success({
        user: userWithZip,
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
