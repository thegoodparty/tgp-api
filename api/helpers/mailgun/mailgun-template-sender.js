const mailgun = require('mailgun-js');

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
      const mg = mailgun({ apiKey: mailgunApiKey, domain });
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
      mg.messages().send(data, function (error, body) {
        if (error) {
          console.log('error sending mail', error);
          return exits.badRequest('error sending email');
        }
        return exits.success({ message: 'email sent successfully' });
      });
    } catch (e) {
      console.log(e);
      throw 'badRequest';
    }
  },
};
