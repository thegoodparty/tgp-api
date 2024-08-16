/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

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
    },
    socialToken: {
      description: 'Social Token that needs to be verified',
      type: 'string',
    },
    socialProvider: {
      description: 'Social provider (facebook, google)',
      type: 'string',
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
      const { email, socialPic, socialToken, socialProvider } = inputs;
      const lowerCaseEmail = email.toLowerCase();

      console.log('here social login', inputs);

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

      let user = await User.findOne({ email: lowerCaseEmail });
      if (!user) {
        // register
        return exits.badRequest({
          message: `User doesn't exist, try registering first.`,
          exists: false,
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

      return exits.success({
        user,
        token,
        newUser: false,
      });
    } catch (err) {
      console.log('login error');
      console.log(err);
      return exits.badRequest({
        message: 'Login Error',
      });
    }
  },
};
