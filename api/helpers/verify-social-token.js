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
      console.log('1. verify social facebook');
      const facebookAppId =
        sails.config.custom.facebookAppId || sails.config.facebookAppId;
      console.log('2. facebookAppId', facebookAppId);
      const facebookAppSecret =
        sails.config.custom.facebookAppSecret || sails.config.facebookAppSecret;

      const options = {
        uri: `https://graph.facebook.com/debug_token?input_token=${socialToken}&access_token=${facebookAppId}|${facebookAppSecret}`,
        json: true,
      };

      console.log('3. options.url', options.url);

      const inspectTokenResponse = await request(options);
      console.log('4. inspectTokenResponse', inspectTokenResponse);
      if (!inspectTokenResponse.data.is_valid) {
        console.log('5. invalid');
        throw 'badRequest';
      }
      //step 2 get email from user id
      const emailOptions = {
        uri: `https://graph.facebook.com/${inspectTokenResponse.data.user_id}?fields=email&access_token=${socialToken}`,
        json: true,
      };

      console.log('6. emailOptions.uri', emailOptions.uri);
      const tokenEmail = await request(emailOptions);
      console.log('7. tokenEmail', tokenEmail);
      if (tokenEmail.email !== email) {
        console.log('8. tokenEmail.email', tokenEmail.email);
        console.log('9. email', email);
        throw 'badRequest';
      }
    }
    console.log('done helper 10');

    return exits.success({ message: 'Valid token' });
  },
};
