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

      const titles = content.map((item) => {
        const article = item.data;
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
