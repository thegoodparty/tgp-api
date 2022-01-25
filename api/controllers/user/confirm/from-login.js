module.exports = {
  friendlyName: 'Confirm Email or phone with token',

  description: 'Confirm Email with token',

  inputs: {
    code: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      isEmail: true,
    },
    phone: {
      type: 'string',
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
      const { code, email, phone } = inputs;
      if (!email && !phone) {
        return exits.badRequest({
          message: 'Email or Phone are required',
        });
      }
      let user;
      if (email) {
        user = await User.findOne({ email });
      } else {
        user = await User.findOne({ phone });
      }
      // const { phone } = user;
      if (phone) {
        try {
          await sails.helpers.sms.smsVerifyCheck(phone, code);
          const updatedUser = await User.updateOne({ id: user.id }).set({
            isPhoneVerified: true,
          });
          const token = await sails.helpers.jwtSign({
            id: user.id,
            email: user.email,
          });
          return exits.success({
            user: updatedUser,
            token
          });
        } catch (e) {
          console.log('error verifying code with phone');
        }
      }
      if (user.emailConfToken !== code) {
        return exits.badRequest({
          message: 'Failed to confirm email. Invalid code.',
        });
      }
      const isExpired =
        user.emailConfTokenDateCreated +
          sails.config.custom.passwordResetTokenTTL <
        Date.now();
      if (user.emailConfToken === code && isExpired) {
        return exits.badRequest({
          message: 'Token Expired.',
          expired: true,
        });
      }
      if (user.emailConfToken === code) {
        const updatedUser = await User.updateOne({ id: user.id }).set({
          emailConfToken: '',
          emailConfTokenDateCreated: '',
          isEmailVerified: true,
        });
        await sendVerifiedEmail(user);
        const token = await sails.helpers.jwtSign({
          id: user.id,
          email: user.email,
        });
        return exits.success({
          user: updatedUser,
          token,
        });
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
  await sails.helpers.mailgun.mailgunSender(
    user.email,
    user.name,
    subject,
    messageHeader,
    message,
  );
};
