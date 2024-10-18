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
      const content = await Content.find({ key: 'blogArticles' });

      const articles = {};
      content.forEach((item) => {
        const article = item.data;
        articles[article.slug] = {
          title: article.title,
          slug: article.slug,
          summary: article.summary,
        };
      });
      return exits.success({
        articles,
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
