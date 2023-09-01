const contentful = require('contentful');
const { isInteger } = require('lodash');
const documentToPlainTextString =
  require('@contentful/rich-text-plain-text-renderer').documentToPlainTextString;

const readingTime = require('reading-time');
const slugify = require('slugify');

module.exports = {
  friendlyName: 'helper for fetching content from contentful cms',
  description:
    'Contentful api. https://www.contentful.com/developers/docs/references/content-delivery-api/',

  inputs: {},

  fn: async function (inputs, exits) {
    const contentfulSpaceId =
      sails.config.custom.contentfulSpaceId || sails.config.contentfulSpaceId;

    const contentfulAccessToken =
      sails.config.custom.contentfulAccessToken ||
      sails.config.contentfulAccessToken;

    const client = contentful.createClient({
      space: contentfulSpaceId,
      accessToken: contentfulAccessToken,
    });

    const entries = await client.getEntries({
      limit: 1000,
    });
    const items = client.parseEntries(entries).items;

    const flatResponse = mapResponse(items);
    return exits.success(flatResponse);
  },
};

const faqsOrder = [];
const faqsOrderHash = {};
const mapResponse = (items) => {
  const mappedResponse = {};
  // console.log(JSON.stringify(items));
  items.map((item) => {
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
        const text = documentToPlainTextString(item.fields.body);
        const time = readingTime(text);
        const article = {
          ...item.fields,
          id: elementId,
          mainImage: extractMediaFile(item.fields.mainImage),
          readingTime: time,
        };
        if (article.section) {
          article.section = {
            id: article.section.sys.id,
            fields: article.section.fields,
          };
        }
        if (article.author) {
          article.author = {
            fields: article.author.fields,
          };
          if (
            article.author.fields.image &&
            article.author.fields.image.fields
          ) {
            article.author.fields.image = extractMediaFile(
              article.author.fields.image,
            );
          }
        }
        if (article.banner) {
          article.banner = {
            ...article.banner.fields,
            largeImage: extractMediaFile(article.banner.fields.largeImage),
            smallImage: extractMediaFile(article.banner.fields.smallImage),
          };
        }
        mappedResponse.blogArticles.push(article);
      } else if (itemId === 'glossaryItem') {
        if (!mappedResponse.glossaryItemsByTitle) {
          mappedResponse.glossaryItemsByLetter = {};
          mappedResponse.glossaryItemsByTitle = {};
        }

        // console.log('item', item);

        const { title } = item.fields;
        const { updatedAt } = item.sys;
        const slug = slugify(title, { lower: true });
        const letter = title.charAt(0).toUpperCase();
        if (!mappedResponse.glossaryItemsByLetter[letter]) {
          mappedResponse.glossaryItemsByLetter[letter] = [];
        }
        mappedResponse.glossaryItemsByLetter[letter].push(item.fields);
        mappedResponse.glossaryItemsByTitle[slug] = {
          ...item.fields,
          updatedAt,
        };
      } else if (itemId === 'faqOrder') {
        const faqOrder = item.fields.faqArticle;
        faqOrder.forEach((article) => {
          faqsOrder.push(article.sys.id);
        });
      } else if (itemId === 'pledge') {
        mappedResponse.pledge = item.fields;
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
      } else if (itemId === 'promptInputFields') {
        if (!mappedResponse.promptInputFields) {
          mappedResponse.promptInputFields = {};
        }

        const entry = [];

        if (item.fields.date) {
          entry.push({
            title: 'Date',
            helperText: item.fields.dateHelperText,
            isDate: true,
          });
        }

        const key = item.fields.fieldId;

        if (item.fields.contentInput) {
          item.fields.contentInput.forEach((item) => {
            const { title, helperText } = item.fields;
            entry.push({
              title,
              helperText,
            });
          });
        }

        mappedResponse.promptInputFields[key] = entry;

        // mappedResponse.privacyPage = item.fields;
      } else if (itemId === 'onboardingPrompts') {
        mappedResponse.onboardingPrompts = item.fields;
      } else if (itemId === 'candidateContentPrompts') {
        mappedResponse.candidateContentPrompts = item.fields;
      } else if (itemId === 'election') {
        if (!mappedResponse.elections) {
          mappedResponse.elections = [];
        }
        const election = {
          ...item.fields,
          id: elementId,
          heroImage: extractMediaFile(item.fields.heroImage),
          skylineImage: extractMediaFile(item.fields.skylineImage),
          districtImage: extractMediaFile(item.fields.districtImage),
        };
        if (election.articles) {
          election.articles = election.articles.map((article) => {
            return {
              id: article.sys.id,
              // fields: article.fields,
              mainImage: extractMediaFile(article.fields.mainImage),
              title: article.fields.title,
              slug: article.fields.slug,
              summary: article.fields.summary,
            };
          });
        }
        mappedResponse.elections.push(election);
      }
    }
  });

  mappedResponse.recentGlossaryItems = getRecentGlossaryItems(mappedResponse);

  // need to order the event chronologically and separate the past events.
  // mappedResponse.events.sort(compareEvents);
  // splitPastEvents(mappedResponse);
  // need to sort faqArticles by the sortOrder.
  faqsOrder.map((id, index) => {
    faqsOrderHash[id] = index + 1;
  });
  mappedResponse.faqArticles.sort(compareArticles);
  mappedResponse.blogArticles.sort(compareBlogArticles);
  // sort each letter
  Object.keys(mappedResponse.glossaryItemsByLetter).forEach((letter) => {
    mappedResponse.glossaryItemsByLetter[letter].sort(compareGlossaryItems);
  });

  addArticlesToCategories(mappedResponse);
  addBlogArticlesToSections(mappedResponse);
  mappedResponse.articleCategories.sort(compareArticleCategories);

  mappedResponse.blogSections.sort(compareBlogSections);

  return mappedResponse;
};

const getRecentGlossaryItems = (mappedResponse) => {
  const sorted = Object.keys(mappedResponse.glossaryItemsByTitle);
  sorted.sort((a, b) => {
    return new Date(b.updatedAt) - new Date(b.updatedAt);
  });
  return sorted.slice(0, 3).map((key) => {
    return mappedResponse.glossaryItemsByTitle[key].title;
  });
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

const compareGlossaryItems = (a, b) => {
  return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
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

const compareBlogSections = (a, b) => {
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

const extractMediaFile = (img) => {
  if (img && img.fields && img.fields.file) {
    return { url: img.fields.file.url, alt: img.fields.title || '' };
  }
  return null;
};

const addArticlesToCategories = (mapped) => {
  const { articleCategories, faqArticles } = mapped;

  const categoriesById = {};
  articleCategories.forEach((category) => {
    categoriesById[category.id] = { ...category, articles: [] };
  });
  faqArticles.forEach((article) => {
    if (article.category) {
      categoriesById[article.category.id].articles.push({
        title: article.title,
        id: article.id,
      });
    }
  });
  mapped.articleCategories = Object.values(categoriesById);
};

const addBlogArticlesToSections = (mapped) => {
  const { blogSections, blogArticles } = mapped;
  const sectionsById = {};
  blogSections.forEach((section) => {
    sectionsById[section.id] = { ...section, articles: [] };
  });
  blogArticles.forEach((article) => {
    if (article.section) {
      sectionsById[article.section.id].articles.push({
        title: article.title,
        id: article.id,
        mainImage: article.mainImage,
        publishDate: article.publishDate,
        slug: article.slug,
        summary: article.summary,
      });
    }
  });
  mapped.blogSections = Object.values(sectionsById);
};
