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

  fn: async function(inputs, exits) {
    try {
      // fetch content from the api
      const content = await sails.helpers.contentful();

      const stringifiedContent = JSON.stringify(content);

      // save content to our DB. Make sure we have only one version of the content
      // first see if we already have an entry
      const contents = await CmsContent.find();
      if (contents.length === 0) {
        // no content yet, create one
        await CmsContent.create({
          content: stringifiedContent,
        });
      } else if (contents.length > 1) {
        console.log('something is off. more than one entry');
        await CmsContent.updateOne({ id: contents[0].id }).set({
          content: stringifiedContent,
        });
      } else {
        await CmsContent.updateOne({ id: contents[0].id }).set({
          content: stringifiedContent,
        });
      }
      await sails.helpers.cacheHelper('delete', 'content');
      // await axios.get(`${appBase}/update-content`);
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
