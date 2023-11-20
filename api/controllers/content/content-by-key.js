/**
 * content/all-content
 *
 * @description :: Returns all content from our CMS.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Landing page content Content',

  inputs: {
    key: {
      required: true,
      type: 'string',
    },
    subKey: {
      type: 'string',
    },
    subValue: {
      type: 'string',
    },
    limit: {
      type: 'number',
    },
    deleteKey: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'ok',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
    notFound: {
      description: 'Not Found',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { key, subKey, subValue, limit, deleteKey } = inputs;

      let content;
      let criteria;
      let entry;

      if (subValue) {
        criteria = { key, subKey: subValue };
      } else {
        criteria = { key };
      }
      if (limit) {
        entry = await Content.find(criteria).limit(limit);
      } else {
        entry = await Content.find(criteria);
      }
      if (entry.length === 0) {
        return exits.notFound();
      }
      if (entry.length === 1) {
        content = entry[0].data;
      }
      if (entry.length > 1) {
        content = [];
        entry.forEach((item) => {
          content.push(item.data);
        });
      }

      if (deleteKey) {
        content.forEach((item) => {
          delete item[deleteKey];
        });
      }

      return exits.success({
        content,
      });
    } catch (err) {
      console.log(err);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at content/landing-page-content',
        err,
      );
      return exits.badRequest({
        message: 'Content fetch failed.',
      });
    }
  },
};
