/**
 * notifications/email-ama.js
 *
 * @description :: Sends and email to stakeholders when user submits a form.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Send Feedback',

  inputs: {
    suggestion: {
      type: 'string',
      required: true,
    },
    url: {
      type: 'string',
      required: true,
    },
    thumbs: {
      type: 'string',
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
      const { user } = this.req;
      const { suggestion, thumbs, url } = inputs;
      const subject = `Feedback provided - Thumbs ${thumbs}`;
      const messageHeader = `Feedback provided - Thumbs ${thumbs}`;
      const email = 'product@goodparty.org';
      const name = 'TGP Admin';
      const msgWithLineBreaks = suggestion.replace(/\r\n|\r|\n/g, '<br/>');
      const message = `
        Thumbs: ${thumbs}<br/><br/>
        URL: https://goodparty.org${url}<br/><br/>
        User: ${user.name} ${user.email} ${user.phone}<br/><br/>
        Suggestion: ${msgWithLineBreaks}
      `;
      const replyEmail = user.email || '';
      await sails.helpers.mailgun.mailgunSender(
        email,
        name,
        subject,
        messageHeader,
        message,
        replyEmail,
      );
      await sendSlackMessage(suggestion, thumbs, url, user);
      return exits.success({
        message: 'Email Sent Successfully',
      });
    } catch (err) {
      console.log('feedback sent error', err);

      return exits.badRequest({
        message: 'Error sending feedback',
      });
    }
  },
};

const sendSlackMessage = async (suggestion,  thumbs, url, user) => {
  const appBase = sails.config.custom.appBase || sails.config.appBase;
  let env = 'dev';
  if (appBase === 'https://goodparty.org') {
    env = 'prod';
  }

  try {
    const message = {
      text: `Feedback Sent - Thumbs: ${thumbs}. ENV: ${env}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `__________________________________ \n *Feedback Sent - Thumbs: ${thumbs}*
                \n <https://goodparty.org${url}>\n
                \n ENV: ${env}`,
          },
        },
      ],
    };

    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Thumbs: ${thumbs || 'N/A'}
        \nSuggestion: ${suggestion}
        \nUser: ${user.name} ${user.email} ${user.phone}`,
      },
    });

    await sails.helpers.slackHelper(message, 'content');
  } catch (e) {
    console.log(e);
  }
};
