/**
 * notifications/email-ama.js
 *
 * @description :: Sends and email to stakeholders when user submits a form.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Email Ask Me Anything',

  description: 'Send email when a user submits a form. Using Mailgun api',

  inputs: {
    message: {
      friendlyName: 'Message',
      description: 'Message from user',
      type: 'string',
      required: true,
    },
    replyEmail: {
      friendlyName: 'Reply To',
      description: 'Reply Email',
      type: 'string',
      isEmail: true
    },
  },

  exits: {
    success: {
      description: 'Email Sent',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error sending email',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { message, replyEmail } = inputs;
      const subject = 'Ama Form Sent';
      const messageHeader = 'Ama Form Sent';
      const email = 'ask@thegoodparty.org';
      const name = 'TGP Admin';
      const msgWithLineBreaks = message.replace(/\r\n|\r|\n/g, '</br>');
      await sails.helpers.mailgunSender(
        email,
        name,
        subject,
        messageHeader,
        msgWithLineBreaks,
        replyEmail
      );
      return exits.success({
        message: 'Email Sent Successfully',
      });
    } catch (err) {
      console.log('email sent error');
      console.log(err);
      await sails.helpers.errorLoggerHelper('Error at notifications/email-ama', e);
      return exits.badRequest({
        message: 'Error sending email',
      });
    }
  },
};
