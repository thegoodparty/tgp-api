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
  },

  fn: async function (inputs, exits) {
    try {
      const { sectionSlug } = inputs;
      const contents = await CmsContent.find();
      const content = JSON.parse(contents[0].content);
      const content2 = JSON.parse(contents[1].content);

      let sections = content.blogSections;
      let heroObj = content2.blogArticles[0];
      const { id, title, mainImage, publishDate, slug, summary } = heroObj;
      let hero = { id, title, mainImage, publishDate, slug, summary };
      let sectionIndex;
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (sectionSlug && section.fields.slug !== sectionSlug) {
          sections[i] = {
            fields: { title: section.fields.title, slug: section.fields.slug },
          };
        }
        if (sectionSlug && section.fields.slug === sectionSlug) {
          sectionIndex = i;
          heroObj = section.articles[0];
          const { id, title, mainImage, publishDate, slug, summary } = heroObj;
          hero = { id, title, mainImage, publishDate, slug, summary };
        }

        if (!sectionSlug && section.articles.length > 3) {
          if (section.articles[0].id === hero.id) {
            section.articles = section.articles.slice(1, 4);
            hero.section = { fields: { title: section.fields.title } };
          } else {
            section.articles = section.articles.slice(0, 3);
          }
        }
      }
      // if (sectionSlug) {
      //   sections = sections.slice(0, 1);
      //   sections[0].articles = sections[0].articles.slice(1);
      // }

      return exits.success({
        sections,
        hero,
        sectionIndex,
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
