module.exports = {
  inputs: {
    sectionSlug: {
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
      description: 'Error',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { sectionSlug } = inputs;

      if (sectionSlug) {
        const sections = await Content.find({
          key: 'blogSections',
        });
        if (!sections) {
          return exits.notFound();
        }
        const results = [];
        let sectionIndex = 0;
        let hero;
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i].data;
          if (section.fields.slug === sectionSlug) {
            sectionIndex = i;
            const { id, title, mainImage, publishDate, slug, summary } =
              section.articles[0];
            hero = { id, title, mainImage, publishDate, slug, summary };
            section.articles = section.articles.slice(1);
            results.push(section);
          } else {
            delete section.articles;
            results.push(section);
          }
        }
        return exits.success({
          sections: results,
          hero,
          sectionIndex,
        });
      } else {
        const sections = await Content.find({ key: 'blogSections' });
        const heroObj = await Content.find({ key: 'blogArticles' })
          .sort('id DESC')
          .limit(1);
        const { id, title, mainImage, publishDate, slug, summary } =
          heroObj[0].data;
        const hero = { id, title, mainImage, publishDate, slug, summary };

        const result = [];
        let sectionIndex = 0;
        for (let i = 0; i < sections.length; i++) {
          sectionIndex = i;
          const section = sections[i].data;
          section.slug = section.fields.slug;
          if (
            section.articles.length > 0 &&
            section.articles[0].id === hero.id
          ) {
            section.articles = section.articles.slice(1, 4);
            hero.section = { fields: { title: section.fields.title } };
          } else {
            section.articles = section.articles.slice(0, 3);
          }
          result.push(section);
        }
        result.sort((a, b) => a.fields.order - b.fields.order);
        return exits.success({
          sections: result,
          sectionIndex,
          hero,
        });
      }
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
