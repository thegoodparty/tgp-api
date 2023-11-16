module.exports = {
  inputs: {
    tag: {
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
  },

  fn: async function (inputs, exits) {
    try {
      const { tag } = inputs;
      const contents = await CmsContent.find();
      const content = JSON.parse(contents[0].content);
      const content2 = JSON.parse(contents[1].content);

      const articles = content2.blogArticles;
      const articleBySlugs = hashArticles(articles);
      let slugs = content.articleTags[tag];
      const tagArticles = [];
      let tagName;
      if (slugs) {
        slugs.forEach((slug) => {
          tagArticles.push(articleBySlugs[slug.slug]);
          tagName = slug.tagName;
        });
      }

      return exits.success({
        articles: tagArticles,
        tagName,
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

function hashArticles(articles) {
  const bySlug = {};
  articles.forEach((article) => {
    const { title, mainImage, publishDate, slug, summary } = article;
    bySlug[slug] = { title, mainImage, publishDate, slug, summary };
  });
  return bySlug;
}
