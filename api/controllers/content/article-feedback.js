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
    uuid: {
      type: 'string',
      required: true,
    },
    title: {
      type: 'string',
      required: true,
    },
    isHelpful: {
      type: 'boolean',
      required: true,
    },
    feedback: {
      type: 'string',
      required: false,
    },
  },

  exits: {
    success: {
      description: 'Feedback Saved',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error saving feedback',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, uuid, title, isHelpful, feedback } = inputs;
      const dbFeedback = await HelpfulArticle.findOrCreate(
        {
          cmsId: id,
          uuid,
        },
        {
          cmsId: id,
          uuid,
          isHelpful,
          feedback,
        },
      );

      await HelpfulArticle.updateOne({ id: dbFeedback.id }).set({
        isHelpful,
        feedback,
      });
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const env = appBase === 'https://thegoodparty.org' ? 'prod' : 'dev';

      const message = {
        text: `Article Helpful? ${
          isHelpful ? 'YES' : 'No'
        }. Title: ${title}. ENV: ${env}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `__________________________________ \n *Article Helpful? ${
                isHelpful ? 'YES' : 'No'
              }* \n <https://thegoodparty.org/party?article=${id}|${title}>\n
                \n ENV: ${env}`,
            },
          },
        ],
      };

      if (feedback) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Feedback: ${feedback}`,
          },
        });
      }

      await sails.helpers.slackHelper(message, 'content');

      return exits.success({
        message: 'Feedback Saved Successfully',
      });
    } catch (err) {
      console.log('Error saving feedback');
      console.log(err);

      await sails.helpers.errorLoggerHelper('Error saving feedback', err);
      return exits.badRequest({
        message: 'Error  saving feedback',
      });
    }
  },
};
