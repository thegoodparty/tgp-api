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
    uuid: {
      type: 'string',
      required: true,
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
      const { id, uuid, title, feedback } = inputs;
      const dbFeedback = await HelpfulArticle.findOrCreate(
        {
          cmsId: id,
          uuid,
        },
        {
          cmsId: id,
          uuid,
          isHelpful: feedback,
        },
      );

      await HelpfulArticle.updateOne({ id: dbFeedback.id }).set({
        isHelpful: feedback,
      });

      return exits.success({
        message: 'Feedback Saved Successfully',
      });
    } catch (err) {
      console.log('Error saving feedback');
      console.log(err);
      return exits.badRequest({
        message: 'Error  saving feedback',
      });
    }
  },
};
