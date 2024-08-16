const { sendEmailWithRetry } = require('../../utils/email/sendEmailWithRetry');
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
    from: {
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
      const { from, to, subject, template, variables, cc } = inputs;
      const data = {
        from: from || 'GoodParty.org <noreply@goodparty.org>',
        to,
        subject,
        template,
        'h:X-Mailgun-Variables': variables,
      };
      if (cc) {
        data.cc = cc;
      }
      await sendEmailWithRetry(data);
      const message = `email sent successfully => ${JSON.stringify(
        data || '{}',
      )}`;
      console.log(message);
      return exits.success({ message });
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'error sending mail - template',
        { error: e, inputs },
      );
      console.error('error sending mail - template', e);

      throw 'badRequest';
    }
  },
};
