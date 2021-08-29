module.exports = {
  friendlyName: 'Confirm Email or phone with token',

  description: 'Confirm Email with token',

  inputs: {
    code: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Account is confirmed',
    },
    badRequest: {
      description: 'Confirmation Failed',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const user = this.req.user;
      const { code } = inputs;
      const { phone, email } = user;
      if (phone) {
        try {
          console.log('phone', phone);
          console.log('code', code);
          await sails.helpers.sms.smsVerifyCheck(phone, code);
          const updatedUser = await User.updateOne({ id: user.id }).set({
            isPhoneVerified: true,
          });
          return exits.success({
            user: updatedUser,
          });
        } catch (e) {
          console.log('error verifying code', e);
          return exits.badRequest({ message: 'error', e });
        }
      } else {
        console.log('update1');
        if (user.emailConfToken !== code) {
          console.log('update2');
          return exits.badRequest({
            message: 'Failed to confirm email. Invalid code.',
          });
        }
        console.log('update3');
        const isExpired =
          user.emailConfTokenDateCreated +
            sails.config.custom.passwordResetTokenTTL <
          Date.now();
        console.log('update4');
        if (user.emailConfToken === code && isExpired) {
          console.log('update5');
          return exits.badRequest({
            message: 'Token Expired.',
            expired: true,
          });
        }
        console.log('update6');
        if (user.emailConfToken === code) {
          console.log('update7');
          const updatedUser = await User.updateOne({ id: user.id }).set({
            emailConfToken: '',
            emailConfTokenDateCreated: '',
            isEmailVerified: true,
          });
          await sendVerifiedEmail(user);
          return exits.success({
            user: updatedUser,
          });
        }
      }
    } catch (e) {
      console.log('error at user/confirm/update', e);
      return exits.badRequest({ message: 'error', e });
    }
  },
};

const sendVerifiedEmail = async user => {
  if (!user.email) {
    return;
  }
  const subject = `You're verified — here's what else you can do to help`;
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
              Your account has been verified and we will update you with campaign updates.
              If you haven’t done so, check out and endorse some Good Party Certified Candidates to let your voice be heard!
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

              </p>
            </td>
          </tr>
        </tbody>
      </table>
      `;

  const messageHeader = '';
  await sails.helpers.mailgunSender(
    user.email,
    user.name,
    subject,
    messageHeader,
    message,
  );
};
