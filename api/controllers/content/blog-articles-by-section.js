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
      const contents = await CmsContent.find();
      const content = JSON.parse(contents[0].content);
      const content2 = JSON.parse(contents[1].content);

      const sections = content.blogSections;
      const heroObj = content2.blogArticles[0];
      const { id, title, mainImage, publishDate, slug, summary } = heroObj;
      const hero = { id, title, mainImage, publishDate, slug, summary };
      sections.forEach((section) => {
        if (section.articles.length > 3) {
          if (section.articles[0].id === hero.id) {
            section.articles = section.articles.slice(1, 4);
            hero.section = { fields: { title: section.fields.title } };
          } else {
            section.articles = section.articles.slice(0, 3);
          }
        }
      });
      return exits.success({
        sections,
        hero,
        // content,
      });
    } catch (err) {
      console.log('Error at content/blog-articles-by-section', err);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at content/blog-articles-by-section',
        err,
      );
      return exits.badRequest({
        message: 'Content fetch failed.',
      });
    }
  },
};
