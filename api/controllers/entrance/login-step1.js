/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Login user',

  description: 'Login step 1.',

  inputs: {
    email: {
      description: 'User Email',
      type: 'string',
      isEmail: true,
    },
    phone: {
      description: 'User Phone',
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Login Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { email, phone } = inputs;
      let user;
      if (email) {
        const lowerCaseEmail = email.toLowerCase();
        user = await User.findOne({ email: lowerCaseEmail });
      } else if (phone) {
        user = await User.findOne({ phone });
      }
      if (!user) {
        return exits.badRequest({});
      }
      if (!user.hasPassword) {
        if (email) {
          const token = Math.floor(100000 + Math.random() * 900000) + '';
          const updatedUser = await User.updateOne({ id: user.id }).set({
            isEmailVerified: false,
            emailConfToken: token,
            emailConfTokenDateCreated: Date.now(),
          });
          await sendWVerifyEmail(updatedUser);
        } else if (phone) {
          await sails.helpers.sms.smsVerify(phone);
        }
      }

      return exits.success({
        hasPassword: user.hasPassword,
      });
    } catch (err) {
      console.log('login error', err);
      return exits.badRequest({
        message: 'unknown error',
      });
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
  console.log('email sent');
  await sails.helpers.mailgunSender(
    lowerCaseEmail,
    name,
    subject,
    messageHeader,
    message,
  );
};
