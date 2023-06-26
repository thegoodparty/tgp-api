/**
 * content/update
 *
 * @description :: Updates the  content from our CMS.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const axios = require('axios');
const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  friendlyName: 'All Content',

  description: 'Updates the  content from our CMS',

  inputs: {},

  exits: {
    success: {
      description: 'Able to fetch all content',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Phone Format Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      // fetch content from the api
      const content = await sails.helpers.contentful();

      // save content to our DB.
      // entry with id=1 has all the content expect for blogArticles
      // row with id=2 has blogArticles

      const stringifiedBlogArticles = JSON.stringify({
        blogArticles: content.blogArticles,
      });
      delete content.blogArticles;
      const stringifiedContent = JSON.stringify(content);

      // first see if we already have an entries
      //
      const contents = await CmsContent.find();
      if (contents.length === 0) {
        // no content yet, create one
        await CmsContent.create({
          content: stringifiedContent,
        });
        await CmsContent.create({
          content: stringifiedBlogArticles,
        });
      } else if (contents.length > 2) {
        console.log('something is off. more than two entries');
        await CmsContent.updateOne({ id: contents[0].id }).set({
          content: stringifiedContent,
        });
        await CmsContent.updateOne({ id: contents[1].id }).set({
          content: stringifiedBlogArticles,
        });
      } else {
        await CmsContent.updateOne({ id: contents[0].id }).set({
          content: stringifiedContent,
        });
        if (contents.length === 1) {
          // temp while we change from one entry to two
          await CmsContent.create({
            content: stringifiedBlogArticles,
          });
        } else {
          await CmsContent.updateOne({ id: contents[1].id }).set({
            content: stringifiedBlogArticles,
          });
        }
      }
      await sails.helpers.cacheHelper('delete', 'content');
      await sails.helpers.cacheHelper('delete', 'contentBlog');
      return exits.success();
    } catch (err) {
      console.log('content error');
      console.log(err);
      await sails.helpers.errorLoggerHelper(
        'Error at content/update',
        JSON.stringify(err),
      );
      return exits.badRequest({
        message: 'Content fetch failed. Please load again.',
      });
    }
  },
};
