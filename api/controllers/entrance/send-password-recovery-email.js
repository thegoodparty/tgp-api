module.exports = {
  friendlyName: 'Send password recovery email',

  description:
    'Send a password recovery notification to the user with the specified email address.',

  inputs: {
    email: {
      description:
        'The email address of the alleged user who wants to recover their password.',
      example: 'rydahl@example.com',
      type: 'string',
      required: true,
      isEmail: true,
    },
  },

  exits: {
    success: {
      description:
        'The email address might have matched a user in the database.  (If so, a recovery email was sent.)',
    },
    badRequest: {
      description: 'error recovering password',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { email } = inputs;
      const lowerCaseEmail = email.toLowerCase();
      // Find the record for this user.
      // (Even if no such user exists, pretend it worked to discourage sniffing.)
      const user = await User.findOne({ email: lowerCaseEmail });
      if (!user) {
        return exits.success({
          message: 'email sent.',
        });
      } //

      // Come up with a pseudorandom, probabilistically-unique token for use
      // in our password recovery email.
      const token = await sails.helpers.strings.random('url-friendly');

      // Store the token on the user record
      // (This allows us to look up the user when the link from the email is clicked.)
      await User.update({ id: user.id }).set({
        passwordResetToken: token,
        passwordResetTokenExpiresAt:
          Date.now() + sails.config.custom.passwordResetTokenTTL,
      });

      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const subject = 'Reset your password - The Good Party';
      const link = encodeURI(
        `${appBase}/you/reset-password?email=${lowerCaseEmail}&token=${token}`,
      );
      const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
                           <tr>
                            <td>
                              <h2 style="color: #484848; text-align: left; font-size: 33px;  letter-spacing: 1px; margin-top: 24px; margin-bottom: 24px;">
                                Reset your password
                              </h2>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                                Hi ${user.name}!<br/> <br>
                              </p>
                            </td>
                          </tr>
                          
                          <tr>
                            <td>
                                <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                                  You told us you forgot your password. If you really did, click here to reset it:
                                  <a href="${link}">Reset Your Password</a>
                                </p>
                             </td>
                          </tr>
                          <tr>
                            <td>
                              <br/><br/><br/>
                              <a href="${link}" style="padding: 16px 32px; background-color: #117CB6; color: #FFF; border-radius: 40px; text-decoration: none;">
                                Reset Your Password                              
                              </a>
                            </td>
                          </tr>
                          <tr>
                            <td>
                                <br/><br/><br/>
                                <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                                  If you didn’t mean to reset your password, then you can just ignore this email; your password will not change.
                                </p>
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
        message: 'email sent.',
      });
    } catch (e) {
      // await sails.helpers.errorLoggerHelper(
      //   'Error at entrance/send-password-recovery-email',
      //   e,
      // );
      console.log('password recvovery error', e);
      return exits.badRequest({ message: 'Password Recovery error' });
    }
  },
};
