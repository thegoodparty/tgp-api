module.exports = {
  inputs: {
    withEmail: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Resending code',
    },
    badRequest: {
      description: 'Confirmation Failed',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const user = this.req.user;
      const { withEmail } = inputs;

      const { phone } = user;
      if (phone && !withEmail) {
        await sails.helpers.sms.smsVerify(phone);
      } else {
        const token = Math.floor(100000 + Math.random() * 900000) + '';
        const updatedUser = await User.updateOne({ id: user.id }).set({
          isEmailVerified: false,
          emailConfToken: token,
          emailConfTokenDateCreated: Date.now(),
        });
        await sendWVerifyEmail(updatedUser);
      }

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      return exits.badRequest({ message: 'error', e });
    }
  },
};

const sendWVerifyEmail = async user => {
  if (!user.email) {
    return;
  }
  const lowerCaseEmail = user.email.toLowerCase();
  const { name } = user;
  const subject = `${user.firstName ||
    user.name}, please verify your email address`;
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
                  Please use this code to verify your email address.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <br /><br />
                <p style="
                    font-size: 30px;
                    font-family: Arial, sans-serif;
                    background: #cccccc;
                    padding: 20px;
                    border-radius: 6px;
                    text-align: center;
                    "
                    >${user.emailConfToken}</p>
              </td>
            </tr>
          </tbody>
        </table>
        `;
  const messageHeader = '';
  await sails.helpers.mailgun.mailgunSender(
    lowerCaseEmail,
    name,
    subject,
    messageHeader,
    message,
  );
};
