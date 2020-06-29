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
      isEmail: true,
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
      const lowerCaseEmail = email.toLowerCase();

      let user = await User.findOne({
        email: lowerCaseEmail,
      });
      if (!user) {
        // don't reveal if the user exists in database or not.
        return exits.success({
          message: 'Email Resent',
        });
      }
      const token = await sails.helpers.strings.random('url-friendly');

      user = await User.updateOne({ email: lowerCaseEmail }).set({
        emailConfToken: token,
        emailConfTokenDateCreated: Date.now(),
      });

      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const subject = `Please Confirm your email address - The Good Party`;
      const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
<tr>
                            <td>
                              <h2 style="color: #484848; text-align: left; font-size: 33px;  letter-spacing: 1px; margin-top: 24px; margin-bottom: 24px;">
                                Please confirm your email
                              </h2>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                                Hi ${user.name}!,<br/> <br>
                              </p>
                            </td>
                          </tr>
                          
                          <tr>
                            <td>
                                <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                                  Welcome to The Good Party!  Please tap to 
                                  <a href="${appBase}/email-confirmation?email=${lowerCaseEmail}&token=${user.emailConfToken}">confirm your email</a>, 
                                  so we can get you counted.
                                </p>
                             </td>
                          </tr>
                          <tr>
                            <td>
                              <br/><br/><br/>  
                              <a href="${appBase}/email-confirmation?email=${lowerCaseEmail}&token=${user.emailConfToken}" style="padding: 16px 32px; background-color: #117CB6; color: #FFF; border-radius: 40px; text-decoration: none;">
                                Confirm Email                              
                              </a>
                            </td>
                          </tr>
                        </table>`;
      const messageHeader = '';
      await sails.helpers.mailgunSender(
        lowerCaseEmail,
        user.name,
        subject,
        messageHeader,
        message,
      );

      return exits.success({
        message: 'Email Resent',
      });
    } catch (e) {
      await sails.helpers.errorLoggerHelper('Error at entrance/resend-verify-email', e);
      console.log('email resent error', JSON.stringify(e));
      return exits.badRequest({ message: 'Error resending email' });
    }
  },
};
