/**
 * content/article-feedback
 *
 * @description :: Send a feedback about an article.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Article Feedback',

  description: 'Send an email with a feedback about an FAQ article',

  inputs: {
    id: {
      type: 'string',
      required: true,
    },
    title: {
      type: 'string',
      required: true,
    },
    feedback: {
      type: 'boolean',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Email sent',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error sending email',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, title, feedback } = inputs;
      const subject = `FAQ Feedback - ${title}`;
      const messageHeader = `FAQ Feedback - ${title}`;
      const email = 'ask@thegoodparty.org';
      const name = 'TGP Admin';
      const msgWithLineBreaks = feedback
        ? `<h3>Yes, was helpful</h3><br/>
          <a href="https://thegoodparty.org/party/faqs?article=${id}">https://thegoodparty.org/party/faqs?article=${id}</a>`
        : `<h3>No was not helpful</h3><br/>
          <a href="https://thegoodparty.org/party/faqs?article=${id}">https://thegoodparty.org/party/faqs?article=${id}</a>`;
      await sails.helpers.mailgunSender(
        email,
        name,
        subject,
        messageHeader,
        msgWithLineBreaks,
      );
      return exits.success({
        message: 'Feedback Sent Successfully',
      });
    } catch (err) {
      console.log('Error sending feedback');
      console.log(err);
      return exits.badRequest({
        message: 'Error sending feedback',
      });
    }
  },
};
