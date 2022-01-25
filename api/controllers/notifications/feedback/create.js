/**
 * notifications/email-ama.js
 *
 * @description :: Sends and email to stakeholders when user submits a form.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Send Feedback',

  inputs: {
    feedbackType: {
      type: 'string',
    },
    suggestion: {
      type: 'string',
      required: true,
    },
    url: {
      type: 'string',
      required: true,
    },
    stars: {
      type: 'number',
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
      const { suggestion, feedbackType, stars, url } = inputs;
      const subject = `Feedback provided - ${feedbackType}`;
      const messageHeader = `Feedback provided - ${feedbackType}`;
      const email = 'product@goodparty.org';
      const name = 'TGP Admin';
      const msgWithLineBreaks = suggestion.replace(/\r\n|\r|\n/g, '<br/>');
      const message = `
        Stars: ${stars}<br/><br/>
        FeedbackType: ${feedbackType}<br/><br/>
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

      await sendSlackMessage(suggestion, feedbackType, stars, url, user);
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

const sendSlackMessage = async (suggestion, feedbackType, stars, url, user) => {
  const appBase = sails.config.custom.appBase || sails.config.appBase;
  let env = 'dev';
  if (appBase === 'https://goodparty.org') {
    env = 'prod';
  }

  try {
    const message = {
      text: `Feedback Sent - Type: ${feedbackType}. ENV: ${env}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `__________________________________ \n *Feedback Sent - Type: ${feedbackType}*
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
        text: `Feedback type: ${feedbackType || 'N/A'}
        \nStars: ${stars || 'N/A'}
        \nSuggestion: ${suggestion}
        \nUser: ${user.name} ${user.email} ${user.phone}`,
      },
    });

    await sails.helpers.slackHelper(message, 'content');
  } catch (e) {
    console.log(e);
  }
};
