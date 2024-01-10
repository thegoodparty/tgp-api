const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);

module.exports = {
  friendlyName: 'Send emails using mailgun helper',

  description: 'Send emails using mailgun',

  inputs: {
    to: {
      type: 'string',
      required: true,
    },
    subject: {
      type: 'string',
      required: true,
    },
    template: {
      type: 'string',
      required: true,
    },
    variables: {
      type: 'string',
    },
    cc: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'success sending email',
    },
    badRequest: {
      description: 'error sending email',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { to, subject, template, variables, cc } = inputs;
      const mailgunApiKey =
        sails.config.custom.MAILGUN_API || sails.config.MAILGUN_API;

      const domain = 'mg.goodparty.org';
      const mg = mailgun.client({ key: mailgunApiKey, username: 'api' });
      const data = {
        from: 'GOOD PARTY <noreply@goodparty.org>',
        to,
        subject,
        template,
        'h:X-Mailgun-Variables': variables,
      };
      if (cc) {
        data.cc = cc;
      }

      await mg.messages.create(domain, data);
      console.log('sent');
      return exits.success({ message: 'email sent successfully' });
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'error sending mail - template',
        e,
      );
      console.log('error sending mail - template', e);

      throw 'badRequest';
    }
  },
};
