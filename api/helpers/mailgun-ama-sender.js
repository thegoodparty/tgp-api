const mailgun = require('mailgun.js');

module.exports = {
  friendlyName: 'MAIL GUN Sender',

  description:
    'Send email via mailgun. https://github.com/auth0/node-jsonwebtoken',

  inputs: {
    message: {
      friendlyName: 'Message',
      description: 'Message from user',
      type: 'string',
    },

    callback: {
      friendlyName: 'callback',
      description: 'callback',
      type: 'ref',
    },
  },



  fn: async function(inputs, exits) {
    try {
      const MAILGUN_API =
        sails.config.custom.MAILGUN_API || sails.config.MAILGUN_API;
      const mg = mailgun.client({ username: 'api', key: MAILGUN_API });

      mg.messages
        .create('sandboxbcb5d5c9a3034d638e5854b64c476b8b.mailgun.org', {
          from: 'TGP APP - AMA <ask@thegoodparty.org>',
          to: ['ask@thegoodparty.org'],
          subject: 'AMA form submitted on TGP App',
          text: inputs.message,
          // html: html(inputs.message),
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

const html = msg => {
  return `
  <table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#e9e9e9">
  <tr>
    <td width="100%" valign="top" align="center">

      <div
          style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
        AMA form submitted on TGP App
      </div>

      <center>
        <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
          <!-- START INTRO -->
          <tr>
            <td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td>
          </tr>

          <tr>
            <td>

              <table cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" width="100%" style="max-width: 660px; background: #F2F2F2 center center; background-size: cover; border: solid 1px #cccccc;"
                     align="center">
                <tr>
                  <td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" height="40"
                      style="font-size: 76px; line-height: 76px; text-align:center; padding:12px 0;"><img
                      src="https://images.ctfassets.net/g08ybc4r0f4b/3ck2MrIB4DUsfuEC0exrHr/0ccdf2c914950ba9b3d2e41c05aed893/image04.svg" height="119" width="300" alt="TGP" /></td>
                </tr>
                <tr>
                  <td height="40" style="font-size: 40px; line-height: 40px;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" valign="top"
                      style="font-family: Arial, sans-serif; font-size:34px; line-height:40px; color:#333333; font-weight:bold; "
                      class="body-text">
                    <h2
                        style="font-family: Arial, sans-serif; font-size:34px; line-height:40px; color:#333333; font-weight:bold; padding:0 20px; margin:0; text-align:center"
                        class="body-text">AMA Form submitted on TGP APP</h2>
                  </td>
                </tr>

                <tr>
                  <td align="center" valign="top"
                      style="font-family: Arial, sans-serif; font-size:14px; line-height:20px; color:#222222; "
                      class="body-text">
                    <p
                        style="font-family: Arial, sans-serif; font-size:18px; line-height:26px; color:#333333; padding:0 20px; margin:0; text-align: left"
                        class="body-text">
                      <br />
                      ${msg}


                    </p>
                  </td>
                </tr>
                <tr>
                  <td height="80" style="font-size: 80px; line-height: 40px;">&nbsp;</td>
                </tr>
                <tr>
                  <td align="center" bgcolor="#FFFFFF"
                      style="font-size: 22px; line-height: 60px; text-align: center; color: #333333; background-color: #FFFFFF; padding: 20px 0;">
                    <strong>The Good Party</strong>
                  </td>
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
