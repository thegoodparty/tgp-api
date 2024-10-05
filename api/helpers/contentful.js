const contentful = require('contentful');
const { camelCase } = require('lodash');
const documentToPlainTextString =
  require('@contentful/rich-text-plain-text-renderer').documentToPlainTextString;

const readingTime = require('reading-time');
const slugify = require('slugify');

const limit = 300;
const calls = 8;

const processTeamMembers = (teamMembers) =>
  teamMembers.map((member) => ({
    ...member.fields,
    id: member.sys.id,
    fullName: member.fields.fullName,
    goodPhoto: extractMediaFile(member.fields.goodPhoto),
    partyPhoto: extractMediaFile(member.fields.partyPhoto),
    role: member.fields.role,
    partyRole: member.fields.partyRole,
  }));

const processTeamMilestone = (item) => ({
  ...item.fields,
  id: item.sys.id,
  month: item.fields.month,
  year: item.fields.year,
  blurb: item.fields.blurb,
  description: item.fields.description,
  image: extractMediaFile(item.fields.image),
});

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

    const rawEntries = await fetchEntries(client, limit, calls);

    const parsedItems = await parseEntries(client, rawEntries);

    const flatResponse = mapResponse(parsedItems);

    return exits.success(flatResponse);
  },
};

const faqsOrder = [];
const faqsOrderHash = {};
const articleTags = {};
const articleTagsSlugs = {}; // to prevent duplicates

function mapResponse(items) {
  const mappedResponse = {};
  // console.log(JSON.stringify(items));
  items.forEach((item) => {
    if (item && item.sys && item.sys.contentType && item.sys.contentType.sys) {
      const itemId = item.sys.contentType.sys.id;
      const elementId = item.sys.id;
      if (itemId === 'faqArticle') {
        if (!mappedResponse.faqArticles) {
          mappedResponse.faqArticles = [];
        }
        const article = {
          ...item.fields,
          id: elementId.toLowerCase(),
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
        const tags = extractArticleTags(item.fields.tags);
        if (tags) {
          tags.forEach((tag) => {
            if (!articleTags[tag.slug]) {
              articleTags[tag.slug] = [];
              articleTagsSlugs[tag.slug] = {};
            }
            if (!articleTagsSlugs[tag.slug][item.fields.slug]) {
              articleTagsSlugs[tag.slug][item.fields.slug] = true;
              articleTags[tag.slug].push({
                slug: item.fields.slug,
                tagName: tag.name,
              });
            }
          });
        }

        const article = {
          ...item.fields,
          updateDate: item.sys.updatedAt,
          id: elementId,
          mainImage: extractMediaFile(item.fields.mainImage),
          readingTime: time,
          tags,
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

        if (article.relatedArticles) {
          article.relatedArticles = article.relatedArticles.map((related) => {
            return {
              ...related.fields,
              mainImage: extractMediaFile(related.fields.mainImage),
            };
          });
        }

        if (article.references) {
          article.references = article.references.map((reference) => ({
            ...reference.fields,
          }));
        }

        mappedResponse.blogArticles.push(article);
      } else if (itemId === 'glossaryItem') {
        if (!mappedResponse.glossaryItemsByTitle) {
          mappedResponse.glossaryItemsByLetter = {};
          mappedResponse.glossaryItemsByTitle = {};
          mappedResponse.glossaryItems = [];
        }

        // console.log('item', item);

        const { title, banner } = item.fields;
        const { updatedAt } = item.sys;
        const slug = slugify(title, { lower: true });
        const letter = title.charAt(0).toUpperCase();
        if (!mappedResponse.glossaryItemsByLetter[letter]) {
          mappedResponse.glossaryItemsByLetter[letter] = [];
        }

        if (banner) {
          item.fields.banner = {
            ...banner.fields,
            largeImage: extractMediaFile(banner.fields.largeImage),
            smallImage: extractMediaFile(banner.fields.smallImage),
          };
        }

        mappedResponse.glossaryItemsByLetter[letter].push(item.fields);
        mappedResponse.glossaryItemsByTitle[slug] = {
          ...item.fields,
          updatedAt,
        };
        mappedResponse.glossaryItems.push({
          slug,
          ...item.fields,
          updatedAt,
        });
      } else if (itemId === 'faqOrder') {
        const faqOrder = item.fields.faqArticle;
        faqOrder.forEach((article) => {
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
      } else if (itemId === 'redirects') {
        if (!mappedResponse.redirects) {
          mappedResponse.redirects = {};
        }
        mappedResponse.redirects[item.fields.pathname] =
          item.fields.redirectUrl;
      } else if (itemId === 'blogSection') {
        if (!mappedResponse.blogSections) {
          mappedResponse.blogSections = [];
        }
        let tags = [];
        if (item.fields?.tags) {
          for (let tag of item.fields.tags) {
            const name = tag?.fields?.name;
            tags.push({
              name: name,
              slug: slugify(name, { lower: true }),
            });
          }
        }

        mappedResponse.blogSections.push({
          fields: item.fields,
          id: elementId,
          slug: item.fields.slug,
          tags,
        });
      } else if (
        [
          'privacyPage',
          'termsOfService',
          'pledge',
          'onboardingPrompts',
        ].includes(itemId)
      ) {
        mappedResponse[itemId] = item.fields;
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
      } else if (itemId === 'aiContentTemplate') {
        if (!mappedResponse.candidateContentPrompts) {
          // legacy name. Keeping it to limit blast radius
          mappedResponse.candidateContentPrompts = {};
        }

        if (!mappedResponse.contentPromptsQuestions) {
          // legacy name. Keeping it to limit blast radius
          mappedResponse.contentPromptsQuestions = {};
        }

        if (!mappedResponse.aiContentCategories) {
          // legacy name. Keeping it to limit blast radius
          mappedResponse.aiContentCategories = [];
          mappedResponse.aiContentCategoriesHash = {};
        }

        const { name, content, category, requiresAdditionalQuestions } =
          item.fields;
        const key = camelCase(name);
        mappedResponse.candidateContentPrompts[key] = content;
        mappedResponse.contentPromptsQuestions[key] =
          requiresAdditionalQuestions;
        const { title, order } = category.fields || {};
        if (!mappedResponse.aiContentCategoriesHash[title]) {
          mappedResponse.aiContentCategoriesHash[title] = [];
          mappedResponse.aiContentCategories.push({ title, order });
        }
        mappedResponse.aiContentCategoriesHash[title].push({ key, name });
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
      } else if (itemId === 'goodPartyTeamMembers') {
        const { members: teamMembers } = item?.fields;
        const goodPartyTeamMembers = processTeamMembers(teamMembers);

        mappedResponse.goodPartyTeamMembers =
          mappedResponse.goodPartyTeamMembers
            ? [...mappedResponse.goodPartyTeamMembers, goodPartyTeamMembers]
            : goodPartyTeamMembers;
      } else if (itemId === 'teamMilestone') {
        mappedResponse.teamMilestones = [
          ...(mappedResponse.teamMilestones || []),
          processTeamMilestone(item),
        ];
      } else if (itemId === 'blogHome') {
        let tags = [];
        if (item.fields?.topTags) {
          for (let tag of item.fields.topTags) {
            const name = tag?.fields?.name;
            tags.push({
              name: name,
              slug: slugify(name, { lower: true }),
            });
          }
        }

        let faqs = [];
        if (item.fields?.articleFaqs) {
          for (let faq of item.fields?.articleFaqs) {
            faqs.push({
              title: faq?.fields?.title,
              id: faq?.sys?.id.toLowerCase(),
            });
          }
        }

        mappedResponse.blogHome = {
          tags,
          faqs,
        };
      } else if (itemId === 'candidateTestimonial') {
        if (!mappedResponse.candidateTestimonials) {
          mappedResponse.candidateTestimonials = [];
        }

        mappedResponse.candidateTestimonials.push({
          ...item.fields,
          image: extractMediaFile(item.fields.image),
        });
      } else if (itemId === 'aiChatPrompt') {
        if (!mappedResponse.aiChatPrompts) {
          mappedResponse.aiChatPrompts = {};
        }
        const { name } = item.fields;
        mappedResponse.aiChatPrompts[name] = {
          ...item.fields,
          id: elementId,
        };
      }
    } else {
      console.log('unhandled item => ', item);
    }
  });

  mappedResponse.recentGlossaryItems = getRecentGlossaryItems(mappedResponse);

  mappedResponse.articleTags = articleTags;

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

  const combinedAi = combineAiContentAndCategories(
    mappedResponse.aiContentCategories,
    mappedResponse.aiContentCategoriesHash,
  );
  mappedResponse.aiContentCategories = combinedAi;
  delete mappedResponse.aiContentCategoriesHash;

  return mappedResponse;
}

function getRecentGlossaryItems(mappedResponse) {
  const sorted = Object.keys(mappedResponse.glossaryItemsByTitle);
  sorted.sort((a, b) => {
    return new Date(b.updatedAt) - new Date(b.updatedAt);
  });
  return sorted.slice(0, 3).map((key) => {
    return mappedResponse.glossaryItemsByTitle[key].title;
  });
}

function compareArticles(a, b) {
  const orderA = faqsOrderHash[a.id] || 9999;
  const orderB = faqsOrderHash[b.id] || 9999;
  if (orderA > orderB) {
    return 1;
  }
  if (orderA < orderB) {
    return -1;
  }
  return 0;
}

function compareBlogArticles(a, b) {
  return new Date(b.publishDate) - new Date(a.publishDate);
}

function compareGlossaryItems(a, b) {
  return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
}

function compareArticleCategories(a, b) {
  const orderA = a.fields.order || 9999;
  const orderB = b.fields.order || 9999;
  if (orderA > orderB) {
    return 1;
  }
  if (orderA < orderB) {
    return -1;
  }
  return 0;
}

function compareBlogSections(a, b) {
  const orderA = a.fields.order || 9999;
  const orderB = b.fields.order || 9999;
  if (orderA > orderB) {
    return 1;
  }
  if (orderA < orderB) {
    return -1;
  }
  return 0;
}

function extractMediaFile(img) {
  if (img && img.fields && img.fields.file) {
    return {
      url: img.fields.file.url,
      alt: img.fields.title || '',
      size: img.fields.file.details?.image,
    };
  }
  return null;
}

function extractArticleTags(tags) {
  if (!tags) {
    return undefined;
  }
  let resTags = [];
  const unique = {};
  tags.forEach((tag) => {
    const slug = slugify(tag.fields.name, { lower: true });
    if (!unique[slug]) {
      unique[slug] = true;
      resTags.push({
        name: tag.fields.name,
        slug,
      });
    }
  });

  return resTags;
}

function addArticlesToCategories(mapped) {
  const { articleCategories, faqArticles } = mapped;

  const categoriesById = {};
  articleCategories.forEach((category) => {
    categoriesById[category.id] = {
      ...category,
      name: category.fields.name,
      articles: [],
    };
  });
  faqArticles.forEach((article) => {
    if (article.category && categoriesById[article.category.id]) {
      categoriesById[article.category.id].articles.push({
        title: article.title,
        id: article.id,
      });
    }
  });
  mapped.articleCategories = Object.values(categoriesById);
}

function addBlogArticlesToSections(mapped) {
  const { blogSections, blogArticles } = mapped;
  const sectionsById = {};
  if (blogSections) {
    blogSections.forEach((section) => {
      sectionsById[section.id] = { ...section, articles: [] };
    });
  }
  if (blogArticles) {
    blogArticles.forEach((article) => {
      if (article.section && sectionsById[article.section.id]) {
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
  }
  mapped.blogSections = Object.values(sectionsById);
}

function combineAiContentAndCategories(categories, categoriesHash) {
  categories.sort((a, b) => a.order - b.order);
  const combined = [];
  categories.forEach((category) => {
    combined.push({
      name: category.title,
      templates: categoriesHash[category.title],
    });
  });
  return combined;
}

async function fetchEntries(client, limit, calls) {
  const allEntries = [];

  for (let i = 0; i < calls; i++) {
    const entries = await client.getEntries({
      limit: limit,
      skip: i * limit,
    });
    allEntries.push(entries);
  }

  return allEntries;
}

async function parseEntries(client, entries) {
  return entries.reduce((acc, entry) => {
    const items = client.parseEntries(entry).items;
    return acc.concat(items);
  }, []);
}
