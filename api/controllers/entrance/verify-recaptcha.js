const {
  RecaptchaEnterpriseServiceV1Beta1Client,
} = require('@google-cloud/recaptcha-enterprise/build/src/v1beta1');

const { GoogleAuth } = require('google-auth-library');
const { grpc } = require('google-gax');

const googleRecaptchaKey =
  sails.config.custom.googleRecaptchaKey || sails.config.googleRecaptchaKey;
console.log('googleRecaptchaKey', googleRecaptchaKey);

module.exports = {
  friendlyName: 'Update password and login',

  description: 'Finish the password recovery flow by setting the new password',

  inputs: {
    token: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Password successfully updated.',
    },

    invalidToken: {
      description:
        'The provided password token is invalid, expired, or has already been used.',
      responseType: 'expired',
    },
    badRequest: {
      description: 'register Failed',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { token } = inputs;
      const projectID = 'thegoodparty-1562658240463';
      const recaptchaSiteKey = '6LefrpgiAAAAAKay43dREi6vvU3afzdoyEBQgZeN';

      /**
       * Create an assessment to analyze the risk of an UI action. Note that
       * this example does set error boundaries and returns `null` for
       * exceptions.
       *
       * projectID: GCloud Project ID
       * recaptchaSiteKey: Site key obtained by registering a domain/app to use recaptcha services.
       * token: The token obtained from the client on passing the recaptchaSiteKey.
       * recaptchaAction: Action name corresponding to the token.
       */

      // Create the reCAPTCHA client & set the project path. There are multiple
      // ways to authenticate your client. For more information see:
      // https://cloud.google.com/docs/authentication

      const client = new RecaptchaEnterpriseServiceV1Beta1Client({
        sslCreds: getApiKeyCredentials(googleRecaptchaKey),
      });
      const projectPath = client.projectPath(projectID);

      // Build the assessment request.
      const request = {
        assessment: {
          event: {
            token,
            siteKey: recaptchaSiteKey,
          },
        },
        parent: projectPath,
      };

      // client.createAssessment() can return a Promise or take a Callback
      const [response] = await client.createAssessment(request);
      // console.log('res', response);

      // Check if the token is valid.
      if (!response.tokenProperties.valid) {
        // console.log(
        //   'The CreateAssessment call failed because the token was: ' +
        //     response.tokenProperties.invalidReason,
        // );

        return exits.badRequest({ message: 'Error verifying recaptcha.' });
      }

      // Check if the expected action was executed.
      // The `action` property is set by user client in the
      // grecaptcha.enterprise.execute() method.
      if (response.tokenProperties.action === 'REGISTER') {
        // Get the risk score and the reason(s).
        // For more information on interpreting the assessment,
        // see: https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
        // console.log('The reCAPTCHA score is: ' + response.score);

        // response.riskAnalysis.reasons.forEach(reason => {
        //   console.log(reason);
        // });
        return exits.success({
          score: response.score > 0.6 ? 'ok' : 'bad',
        });
      } else {
        // console.log(
        //   'The action attribute in your reCAPTCHA tag ' +
        //     'does not match the action you are expecting to score',
        // );
        return exits.badRequest({ message: 'Error verifying recaptcha.' });
      }
    } catch (e) {
      console.log('Error verifying recaptcha', e);
      return exits.badRequest({ message: 'Error verifying recaptcha.' });
    }
  },
};

const getApiKeyCredentials = apiKey => {
  const sslCreds = grpc.credentials.createSsl();

  const authJWT = new GoogleAuth().fromAPIKey(apiKey);
  const credentials = grpc.credentials.createFromGoogleCredential(authJWT);

  return grpc.credentials.combineChannelCredentials(sslCreds, credentials);
};
