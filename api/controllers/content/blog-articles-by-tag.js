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

      const articleTags = (await Content.findOne({ key: 'articleTags' })).data;
      const slugs = articleTags[tag];
      const querySlugs = slugs.map((slug) => slug.slug);
      const articles = await Content.find({
        key: 'blogArticles',
        subKey: querySlugs,
      });

      const articleBySlugs = hashArticles(articles);
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
    const { title, mainImage, publishDate, slug, summary } = article.data;
    bySlug[slug] = { title, mainImage, publishDate, slug, summary };
  });
  return bySlug;
}
