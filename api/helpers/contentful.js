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
      } else if (itemId === 'partyPage') {
        mappedResponse.partyPage = item.fields;
      } else if (itemId === 'portalEmbed') {
        mappedResponse.portalEmbed = item.fields;
      }  else if (itemId === 'teamPage') {
        mappedResponse.teamPage = item.fields;
      } else if (itemId === 'landingPage') {
        if (!mappedResponse.landingPages) {
          mappedResponse.landingPages = {};
        }
        const page = {
          ...item.fields,
          id: elementId,
        };

        mappedResponse.landingPages[item.fields.slug] = page;
      } else if (itemId === 'privacyPage') {
        mappedResponse.privacyPage = item.fields;
      } else if (itemId === 'goodPracticesPage') {
        mappedResponse.goodPracticesPage = item.fields;
        mappedResponse.goodPracticesPage.videoImage = extractMediaFile(
          item.fields.videoImage,
        );
      } else if (itemId === 'meetTheCandidates') {
        mappedResponse.meetTheCandidates = item.fields;
        mappedResponse.meetTheCandidates.videoPlaceholder = extractMediaFile(
          item.fields.videoPlaceholder,
        );
      } else if (itemId === 'researchPage') {
        mappedResponse.researchPage = item.fields;
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
  addArticlesToCategories(mappedResponse);
  mappedResponse.articleCategories.sort(compareArticleCategories);

  return mappedResponse;
};

const mapEvent = (fields, id) => {
  const flatResponse = {};
  const {
    title,
    dateAndTime,
    description,
    timeZone,
    displayDate,
    eventDuration,
    presenter,
    location,
    video,
  } = fields;
  if (presenter) {
  }
  flatResponse.id = id;
  flatResponse.title = title;
  flatResponse.dateAndTime = dateAndTime;
  flatResponse.description = description;
  flatResponse.timeZone = timeZone;
  flatResponse.displayDate = displayDate;
  flatResponse.eventDuration = eventDuration;
  flatResponse.location = location;
  if (presenter) {
    const { name, title, avatarPhoto } = presenter.fields;
    flatResponse.presenter = name;
    flatResponse.presenterTitle = title;
    flatResponse.avatarPhoto = extractMediaFile(avatarPhoto);
  }
  if (video) {
    flatResponse.video = extractMediaFile(video);
  }
  return flatResponse;
};
//
// const splitPastEvents = response => {
//   // at this point the events are already sorted from past to future.
//
//   const allEvents = response.events;
//   const events = [];
//   const pastEvents = [];
//
//   allEvents.map(event => {
//     const today = new Date();
//     const serverHoursOffset = today.getTimezoneOffset() / 60;
//
//     const timeZoneHours = timeZoneToHours(event.timeZone);
//     today.setHours(today.getHours() + timeZoneHours + serverHoursOffset);
//     const eventDate = new Date(event.dateAndTime);
//     event.utcTime = eventDate.getTime();
//
//     if (eventDate < today) {
//       pastEvents.push(event);
//     } else {
//       events.push(event);
//     }
//   });
//   response.events = events;
//   response.pastEvents = pastEvents;
// };
//
// const compareEvents = (a, b) => {
//   const dateA = new Date(a.dateAndTime);
//   const dateB = new Date(b.dateAndTime);
//   if (dateA > dateB) {
//     return -1;
//   }
//   if (dateA < dateB) {
//     return 1;
//   }
//   return 0;
// };

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

const timeZoneToHours = timezone => {
  if (!timezone) {
    return 0;
  }
  if (timezone === 'PST') {
    return -8;
  } else if (timezone === 'EST') {
    return -5;
  } else if (timezone == 'CST') {
    return -6;
  }
  return 0;
};

const extractMediaFile = img => {
  if (img && img.fields && img.fields.file) {
    return img.fields.file.url;
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
