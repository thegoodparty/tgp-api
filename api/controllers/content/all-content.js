/**
 * content/all-content
 *
 * @description :: Returns all content from our CMS.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'All Content',

  description: 'Returns all content from our CMS.',

  inputs: {},

  exits: {
    success: {
      description: 'Able to fetch all content',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error getting content',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const contents = await CmsContent.find();
      if (contents.length === 2) {
        const content1 = JSON.parse(contents[0].content);
        const content2 = JSON.parse(contents[1].content);

        return exits.success({
          ...content1,
          ...content2,
        });
      } else {
        return exits.badRequest({
          message: 'No Content Found',
        });
      }
    } catch (err) {
      console.log('content error');
      console.log(err);
      await sails.helpers.errorLoggerHelper(
        'Error at content/all-content',
        err,
      );
      return exits.badRequest({
        message: 'Content fetch failed. Please load again.',
      });
    }
  },
};
