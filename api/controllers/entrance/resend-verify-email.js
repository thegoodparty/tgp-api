/**
 * entrance/resend-verify-email.js
 *
 * @description :: Resend verification email
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Resend verification email',

  description: 'Resend verification email',

  inputs: {
    email: {
      description: 'User Email',
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Email resent',
      responseType: 'ok',
    },
    badRequest: {
      description: 'email resent failed',
      responseType: 'badRequest',
    },
  },
  fn: async function(inputs, exits) {
    // Look up the user whose ID was specified in the request.
    // Note that we don't have to validate that `userId` is a number;
    // the machine runner does this for us and returns `badRequest`
    // if validation fails.
    try {
      const { email } = inputs;
      const user = await User.findOne({
        email,
      });
      if (!user) {
        // don't reveal if the user exists in database or not.
        return exits.success({
          message: 'Email Resent',
        });
      }

      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const subject = `Please Confirm your email address - The Good Party`;
      const message = `Hi ${user.name},<br/> <br/>
                         Welcome to The Good Party! In order to get counted, you need to confirm your email address. <br/> <br/>
                         <a href="${appBase}/email-confirmation?email=${email}&token=${user.emailConfToken}">Confirm Email</a>`;
      const messageHeader = 'Please confirm your email';
      await sails.helpers.mailgunSender(
        email,
        user.name,
        subject,
        messageHeader,
        message,
      );

      return exits.success({
        message: 'Email Resent',
      });
    } catch (e) {
      console.log('email resent error', JSON.stringify(e));
      return exits.badRequest({ message: 'Error resending email' });
    }
  },
};
