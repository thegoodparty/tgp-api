/**
 * user/login.js
 *
 * @description :: Server-side controller action for handling incoming requests.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Login user',

  description:
    'Login user with email and password. Return the user and jwt access token.',

  inputs: {
    email: {
      description: 'User Phone',
      type: 'string',
      required: true,
      isEmail: true,
    },
  },

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Phone Format Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { email } = inputs;
      const lowerCaseEmail = email.toLowerCase();

      const user = await User.findOne({ email: lowerCaseEmail });
      if (!user) {
        return exits.success(); //we don't disclose whether we have a user in the db or not
      }

      let randomCode = parseInt(Math.random() * 1000000);
      if (randomCode < 100000) {
        randomCode += 124000;
      }

      await User.updateOne({ email: lowerCaseEmail }).set({
        emailConfToken: randomCode,
        emailConfTokenDateCreated: Date.now(),
      });

      const subject = `Your Good Party code is: ${randomCode}`;
      const message = `<table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
                          <tr>
                            <td>
                              <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                                Hi ${user.name},<br/> <br/>Your Login Code is:
                              </p>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <h2 style="color: #484848; text-align: left; font-size: 33px;  letter-spacing: 1px; margin-top: 24px; margin-bottom: 24px;">${randomCode}</h2>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; margin:0; text-align: left">
                                Please use this code to complete you login at The Good Party.  This code will expire in 24 hours.
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

      return exits.success();
    } catch (err) {
      await sails.helpers.errorLoggerHelper('Error at entrance/login', e);
      console.log('login error');
      console.log(err);
      return exits.success();
    }
  },
};
