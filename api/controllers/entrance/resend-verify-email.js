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
  async fn(inputs, exits) {
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
      console.log(user.firstName)
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const subject = `${user.firstName || user.name}, please verify your email address`;
      const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
      <tbody>
        <tr>
          <td>
            <p
              style="
                font-size: 16px;
                font-family: Arial, sans-serif;
                margin-top: 0;
                margin-bottom: 5px;
              "
            >
              Hi ${user.firstName || user.name}!<br /><br />
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p
              style="
                font-size: 16px;
                font-family: Arial, sans-serif;
                margin-top: 0;
                margin-bottom: 5px;
              "
            >
              We need to know you’re not a bot and to be able to reach you with
              important campaign updates.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p
              style="
                font-size: 16px;
                font-family: Arial, sans-serif;
                margin-top: 0;
                margin-bottom: 5px;
              "
            >
              <br/>
              Please click below to verify your email address.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <br /><br /><a
              href="${appBase}/email-confirmation?email=${lowerCaseEmail}&token=${user.emailConfToken}"
              style="
                padding: 16px 32px;
                background: linear-gradient(
                    103.63deg,
                    rgba(255, 15, 19, 0.15) -3.51%,
                    rgba(191, 0, 32, 0) 94.72%
                  ),
                  linear-gradient(
                    257.82deg,
                    rgba(67, 0, 211, 0.25) -11.17%,
                    rgba(67, 0, 211, 0) 96.34%
                  ),
                  #5c00c7;
                color: #fff;
                font-size: 16px;
                border-radius: 8px;
                text-decoration: none;
              "
            >
              CLICK TO VERIFY
            </a>
          </td>
        </tr>
      </tbody>
    </table>
    `;
      const messageHeader = '';
      await sails.helpers.mailgun.mailgunSender(
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
      await sails.helpers.errorLoggerHelper(
        'Error at entrance/resend-verify-email',
        e,
      );
      console.log('email resent error', JSON.stringify(e));
      return exits.badRequest({ message: 'Error resending email' });
    }
  },
};
