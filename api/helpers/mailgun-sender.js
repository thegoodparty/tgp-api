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
    fromEmail: {
      friendlyName: 'From Email',
      type: 'string',
      isEmail: true,
    },
  },

  fn: async function(inputs, exits) {
    try {
      const {
        message,
        messageHeader,
        email,
        name,
        subject,
        fromEmail,
      } = inputs;
      const MAILGUN_API =
        sails.config.custom.MAILGUN_API || sails.config.MAILGUN_API;
      const mg = mailgun.client({ username: 'api', key: MAILGUN_API });
      
      // const validFromEmail =
      //   fromEmail || 'The Good Party <noreply@goodparty.org>';
      const validFromEmail = fromEmail || 'GOOD PARTY <noreply@goodparty.org>';
      
      mg.messages
        .create('mg.goodparty.org', {
          from: validFromEmail,
          to: email,
          subject,
          text: message,
          html: html(message, messageHeader, subject),
        })
        .then(msg => {}) // logs response data
        .catch(e => {
          console.log('error at helpers/mailgun-sender', e);
          throw e;
        }); // logs any error

      return exits.success();
    } catch (e) {
      console.log('error at helpers/mailgun-sender', e);
      throw e;
    }
  },
};

const html = (msg = '', messageHeader = '', subject = '') => {
  return `
<style type="text/css">
  html, body {
  background: #EFEFEF;
  padding: 0;
  margin: 0;
  }
</style>
<table width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF">
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
              <table cellspacing="0" cellpadding="0" border="0" bgcolor="#FFFF" width="100%" style="max-width: 660px; background: #FFFF center center; background-size: cover;"
                align="center">

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
              </table>
            </td>
          </tr>
          <!-- END INTRO -->
          <tr>
            <td style="text-align: center">
              <br /><br /><br /><br />
              <p
                style="
                  font-style: italic;
                  font-weight: normal;
                  font-size: 16px;
                  line-height: 22px;
                  text-align: center;
                  color: #555555;
                  text-decoration: none;
                  margin-bottom: 0;
                "
              >
                Free software for free elections by
              </p>
            </td>
          </tr>
          <tr>
            <td style="text-align: center">
            <br />
                <img
                  style="margin: 0 auto"
                  src="https://s3-us-west-2.amazonaws.com/assets.goodparty.org/new-heart.png"
                />
            </td>
          </tr>
          <tr>
            <td style="text-align: center">
              <br /><br />
              <p
                style="
                  font-weight: normal;
                  font-size: 11px;
                  line-height: 15px;
                  /* identical to box height, or 136% */

                  text-align: center;
                  letter-spacing: 0.5px;

                  /* Neutral/N40 - Faded Ink */

                  color: #666666;
                "
              >
                To stop receiving updates, you can remove this campaign from  <a href="https://thegoodparty.org/profile">
                your endorsements
                </a>
              </p>
            </td>
          </tr>
        </table>
      </center>
    </td>
  </tr>
</table>`;
};
