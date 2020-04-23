const { OAuth2Client } = require('google-auth-library');
const request = require('request-promise');

module.exports = {
  friendlyName: 'Verify social token',

  description:
    'Verify that the social token provided is valid and matching the email give.',

  inputs: {
    email: {
      type: 'string',
    },
    socialToken: {
      type: 'string',
    },
    socialProvider: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Valid Token',
    },

    badRequest: {
      description: 'Invalid Token',
    },
  },

  fn: async function(inputs, exits) {
    const { email, socialToken, socialProvider } = inputs;

    let tokenEmail;
    if (socialProvider === 'google') {
      // https://developers.google.com/identity/sign-in/web/backend-auth
      const CLIENT_ID =
        sails.config.custom.googleClientId || sails.config.googleClientId;
      const client = new OAuth2Client(CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: socialToken,
        audience: CLIENT_ID,
      });
      const payload = ticket.getPayload();
      tokenEmail = payload.email;
      if (tokenEmail !== email) {
        throw 'badRequest';
      }
    } else if (socialProvider === 'facebook') {
      // step 1 - verify the access token is valid
      const facebookAppId =
        sails.config.custom.facebookAppId || sails.config.facebookAppId;
      const facebookAppSecret =
        sails.config.custom.facebookAppSecret || sails.config.facebookAppSecret;

      const options = {
        uri: `https://graph.facebook.com/debug_token?input_token=${socialToken}&access_token=${facebookAppId}|${facebookAppSecret}`,
        json: true,
      };

      const inspectTokenResponse = await request(options);
      if (!inspectTokenResponse.data.is_valid) {
        throw 'badRequest';
      }
      //step 2 get email from user id
      const emailOptions = {
        uri: `https://graph.facebook.com/${inspectTokenResponse.data.user_id}?fields=email&access_token=${socialToken}`,
        json: true,
      };

      const tokenEmail = await request(emailOptions);
      if (tokenEmail.email !== email) {
        throw 'badRequest';
      }
    }

    return exits.success({ message: 'Valid token' });
  },
};
