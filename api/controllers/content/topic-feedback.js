/**
 * content/article-feedback
 *
 * @description :: Send a feedback about an article.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
module.exports = {
  friendlyName: 'Topic Feedback',

  description: 'Send an email with a feedback about an topic',

  inputs: {
    candidateId: {
      type: 'string',
      required: true,
    },
    uuid: {
      type: 'string',
      required: true,
    },
    topicTitle: {
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

  async fn(inputs, exits) {
    try {
      // const { uuid, candidateId, topicTitle, isHelpful, feedback } = inputs;
      // const topic = await CompareTopic.findOne({
      //   name: topicTitle,
      // });
      // const dbFeedback = await HelpfulTopic.findOrCreate(
      //   {
      //     candidateId,
      //     topicId: topic.id,
      //     uuid,
      //   },
      //   {
      //     uuid,
      //     candidateId,
      //     topicId: topic.id,
      //     isHelpful,
      //     feedback,
      //   },
      // );
      //
      // await HelpfulTopic.updateOne({ id: dbFeedback.id }).set({
      //   isHelpful,
      //   feedback,
      // });
      // const appBase = sails.config.custom.appBase || sails.config.appBase;
      // let env = 'dev';
      // if (appBase === 'https://goodparty.org') {
      //   env = 'prod';
      // }
      //
      // try {
      //   const message = {
      //     text: `Topic Helpful? ${
      //       isHelpful ? 'YES' : 'No'
      //     }. Title: ${topicTitle}. ENV: ${env}`,
      //     blocks: [
      //       {
      //         type: 'section',
      //         text: {
      //           type: 'mrkdwn',
      //           text: `__________________________________ \n *Article Helpful? ${
      //             isHelpful ? 'YES' : 'No'
      //           }* \n
      //             \n ENV: ${env}`,
      //         },
      //       },
      //     ],
      //   };
      //
      //   if (feedback) {
      //     message.blocks.push({
      //       type: 'section',
      //       text: {
      //         type: 'mrkdwn',
      //         text: `Feedback: ${feedback}`,
      //       },
      //     });
      //   }
      //
      //   await sails.helpers.slackHelper(message, 'content');
      // } catch (e) {
      //   console.log('slack error', e);
      // }
      // needs more cleanup here

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
