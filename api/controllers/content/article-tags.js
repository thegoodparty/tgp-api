module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'ok',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { data } = await Content.findOne({ key: 'articleTags' });

      const tags = Object.entries(data)
        .map(([tagSlug, tagPages]) => ({
          slug: tagSlug,
          name: tagPages[0]?.tagName,
        }))
        .sort((a, b) => {
          if (a.name < b.name) {
            return -1;
          }
          if (a.name > b.name) {
            return 1;
          }
          return 0;
        });

      return exits.success({
        tags,
      });
    } catch (err) {
      console.log(err);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at content/article-tags',
        err,
      );
      return exits.badRequest({
        message: 'Content fetch failed.',
      });
    }
  },
};
