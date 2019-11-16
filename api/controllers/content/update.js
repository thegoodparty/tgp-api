/**
 * content/update
 *
 * @description :: Updates the  content from our CMS.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */
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
      const contents = await Content.find();
      if (contents.length === 0) {
        // no content yet, create one
        await Content.create({
          content: stringifiedContent,
        });
      } else if (contents.length > 1) {
        console.log('something is off. more than one entry');
        await Content.updateOne({ id: contents[0].id }).set({
          content: stringifiedContent,
        });
      } else {
        await Content.updateOne({ id: contents[0].id }).set({
          content: stringifiedContent,
        });
      }

      return exits.success();
    } catch (err) {
      console.log('content error');
      console.log(err);
      return exits.badRequest({
        message: 'Content fetch failed. Please load again.',
      });
    }
  },
};
