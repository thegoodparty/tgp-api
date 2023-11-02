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
      // const { key, subKey, subValue, limit, deleteKey } = inputs;
      const contents = await CmsContent.find();
      const content = JSON.parse(contents[1].content);

      const keyContent = content.blogArticles;
      const titles = keyContent.map((article) => {
        return { title: article.title, slug: article.slug };
      });
      return exits.success({
        titles,
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
