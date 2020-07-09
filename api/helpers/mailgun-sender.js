const mailgun = require('mailgun.js');

module.exports = {
  friendlyName: 'MAIL GUN Sender',

  description:
    'Send email via mailgun. https://github.com/auth0/node-jsonwebtoken',

  inputs: {
    email: {
      friendlyName: 'Email',
      type: 'string',
    },
    name: {
      friendlyName: 'Name',
      type: 'string',
    },
    subject: {
      friendlyName: 'Emails Subject',
      type: 'string',
    },
    messageHeader: {
      friendlyName: 'Message',
      description: 'Message from user',
      type: 'string',
    },
    message: {
      friendlyName: 'Message',
      description: 'Message from user',
      type: 'string',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { message, messageHeader, email, name, subject } = inputs;
      const MAILGUN_API =
        sails.config.custom.MAILGUN_API || sails.config.MAILGUN_API;
      const mg = mailgun.client({ username: 'api', key: MAILGUN_API });

      mg.messages
        .create('mg.thegoodparty.org', {
          from: 'NoReply@TheGoodParty.org <noreply@thegoodparty.org>',
          to: email,
          subject,
          text: message,
          html: html(message, messageHeader, subject),
        })
        .then(msg => {}) // logs response data
        .catch(err => {
          console.log(err);
          return exits.badRequest({
            message: 'Error sending email',
          });
        }); // logs any error

      return exits.success();
    } catch (e) {
      return exits.badRequest({
        message: 'Error sending email',
      });
    }
  },
};

const html = (msg='', messageHeader='', subject='') => {
  return `
<style type="text/css">
  html, body {
  background: #EFEFEF;
  padding: 0;
  margin: 0;
  }
</style>
<table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EFEFEF">
  <tr>
    <td width="100%" valign="top" align="center">
      <div
        style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        ${subject}
      </div>
      <center>
        <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
          <!-- START INTRO -->
          <tr>
            <td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td>
          </tr>
          <tr>
            <td>
              <table cellspacing="0" cellpadding="0" border="0" bgcolor="#EFEFEF" width="100%" style="max-width: 660px; background: #EFEFEF center center; background-size: cover;"
                align="center">
                <tr>
                  <td  height="42"
                    style="font-size: 42px; line-height: 42px;"><img
                    src="https://assets.thegoodparty.org/heart.png" height="42" width="53" alt="TGP" style="margin-left: 12px;" /></td>
                </tr>
                <tr>
                  <td align="center" valign="top"
                    style="font-family: Arial, sans-serif; font-size:34px; line-height:40px; color:#555555; font-weight:bold; "
                    class="body-text">
                    <h2
                      style="font-family: Arial, sans-serif; font-size:34px; line-height:40px; color:#555555; font-weight:bold; padding:0 20px; margin:0; text-align:center"
                      class="body-text">${messageHeader}</h2>
                  </td>
                </tr>
                <tr>
                  <td align="center" valign="top"
                    style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#484848; "
                    class="body-text">
                    <p
                      style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#484848; padding:0 20px; margin:0; text-align: left"
                      class="body-text">
                      <br />
                      ${msg}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td height="80" style="font-size: 80px; line-height: 40px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- END INTRO -->
          <tr>
            <td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td>
          </tr>
        </table>
      </center>
    </td>
  </tr>
</table>`;
};
