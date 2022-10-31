const contentful = require('contentful');

module.exports = {
  friendlyName: 'helper for fetching content from contentful cms',
  description:
    'Contentful api. https://www.contentful.com/developers/docs/references/content-delivery-api/',

  inputs: {},

  fn: async function(inputs, exits) {
    const contentfulSpaceId =
      sails.config.custom.contentfulSpaceId || sails.config.contentfulSpaceId;

    const contentfulAccessToken =
      sails.config.custom.contentfulAccessToken ||
      sails.config.contentfulAccessToken;

    const client = contentful.createClient({
      space: contentfulSpaceId,
      accessToken: contentfulAccessToken,
    });

    const entries = await client.getEntries();
    const items = client.parseEntries(entries).items;
    const flatResponse = mapResponse(items);
    return exits.success(flatResponse);
  },
};

const faqsOrder = [];
const faqsOrderHash = {};
const mapResponse = items => {
  const mappedResponse = {};
  // console.log(JSON.stringify(items));
  items.map(item => {
    if (item && item.sys && item.sys.contentType && item.sys.contentType.sys) {
      const itemId = item.sys.contentType.sys.id;
      const elementId = item.sys.id;
      if (itemId === 'faqArticle') {
        if (!mappedResponse.faqArticles) {
          mappedResponse.faqArticles = [];
        }
        const article = {
          ...item.fields,
          id: elementId,
        };
        if (article.category) {
          article.category = {
            id: article.category[0].sys.id,
            fields: article.category[0].fields,
          };
        }
        mappedResponse.faqArticles.push(article);
      } else if (itemId === 'blogArticle') {
        if (!mappedResponse.blogArticles) {
          mappedResponse.blogArticles = [];
        }
        const article = {
          ...item.fields,
          id: elementId,
          mainImage: extractMediaFile(item.fields.mainImage),
        };
        if (article.section) {
          article.section = {
            id: article.section.sys.id,
            fields: article.section.fields,
          };
        }
        mappedResponse.blogArticles.push(article);
      } else if (itemId === 'faqOrder') {
        const faqOrder = item.fields.faqArticle;
        faqOrder.forEach(article => {
          faqsOrder.push(article.sys.id);
        });
      } else if (itemId === 'articleCategory') {
        if (!mappedResponse.articleCategories) {
          mappedResponse.articleCategories = [];
        }
        mappedResponse.articleCategories.push({
          fields: item.fields,
          id: elementId,
        });
      } else if (itemId === 'blogSection') {
        if (!mappedResponse.blogSections) {
          mappedResponse.blogSections = [];
        }
        mappedResponse.blogSections.push({
          fields: item.fields,
          id: elementId,
        });
      } else if (itemId === 'privacyPage') {
        mappedResponse.privacyPage = item.fields;
      }
    }
  });
  // need to order the event chronologically and separate the past events.
  // mappedResponse.events.sort(compareEvents);
  // splitPastEvents(mappedResponse);
  // need to sort faqArticles by the sortOrder.
  faqsOrder.map((id, index) => {
    faqsOrderHash[id] = index + 1;
  });
  mappedResponse.faqArticles.sort(compareArticles);
  mappedResponse.blogArticles.sort(compareBlogArticles);
  addArticlesToCategories(mappedResponse);
  addBlogArticlesToSections(mappedResponse);
  mappedResponse.articleCategories.sort(compareArticleCategories);

  return mappedResponse;
};

const compareArticles = (a, b) => {
  const orderA = faqsOrderHash[a.id] || 9999;
  const orderB = faqsOrderHash[b.id] || 9999;
  if (orderA > orderB) {
    return 1;
  }
  if (orderA < orderB) {
    return -1;
  }
  return 0;
};

const compareBlogArticles = (a, b) => {
  return new Date(b.publishDate) - new Date(a.publishDate);
};

const compareArticleCategories = (a, b) => {
  const orderA = a.fields.order || 9999;
  const orderB = b.fields.order || 9999;
  if (orderA > orderB) {
    return 1;
  }
  if (orderA < orderB) {
    return -1;
  }
  return 0;
};

const extractMediaFile = img => {
  if (img && img.fields && img.fields.file) {
    return { url: img.fields.file.url, alt: img.fields.title || '' };
  }
  return null;
};

const addArticlesToCategories = mapped => {
  const { articleCategories, faqArticles } = mapped;
  const categoriesById = {};
  articleCategories.forEach(category => {
    categoriesById[category.id] = { ...category, articles: [] };
  });
  faqArticles.forEach(article => {
    if (article.category) {
      categoriesById[article.category.id].articles.push({
        title: article.title,
        id: article.id,
      });
    }
  });
  mapped.articleCategories = Object.values(categoriesById);
};

const addBlogArticlesToSections = mapped => {
  const { blogSections, blogArticles } = mapped;
  const sectionsById = {};
  blogSections.forEach(section => {
    sectionsById[section.id] = { ...section, articles: [] };
  });
  blogArticles.forEach(article => {
    if (article.section) {
      sectionsById[article.section.id].articles.push({
        title: article.title,
        id: article.id,
        mainImage: article.mainImage,
        publishDate: article.publishDate,
      });
    }
  });
  mapped.blogSections = Object.values(sectionsById);
};
