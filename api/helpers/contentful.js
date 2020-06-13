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
        mappedResponse.faqArticles.push({
          ...item.fields,
          id: elementId,
        });
      } else if (itemId === 'event') {
        if (!mappedResponse.events) {
          mappedResponse.events = [];
        }
        mappedResponse.events.push(mapEvent(item.fields, elementId));
      } else if (itemId === 'partyPage') {
        mappedResponse.partyPage = item.fields;
      } else if (itemId === 'privacyPage') {
        mappedResponse.privacyPage = item.fields;
      } else if (itemId === 'appVersion') {
        mappedResponse.appVersion = item.fields;
      } else if (itemId === 'researchPage') {
        mappedResponse.researchPage = item.fields;
      } else if (itemId === 'creatorsProject') {
        if (!mappedResponse.creatorsProjects) {
          mappedResponse.creatorsProjects = [];
        }
        const images = [];
        if (item.fields.images && item.fields.images.length > 0) {
          item.fields.images.forEach(image => {
            images.push(extractMediaFile(image));
          });
        }
        const creatorPhoto = extractMediaFile(item.fields.creatorPhoto);
        mappedResponse.creatorsProjects.push({
          ...item.fields,
          images,
          creatorPhoto,
          id: elementId,
        });
      }
    }
  });
  // need to order the event chronologically and separate the past events.
  mappedResponse.events.sort(compareEvents);
  splitPastEvents(mappedResponse);
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
  return flatResponse;
};

const splitPastEvents = response => {
  // at this point the events are already sorted from past to future.

  const allEvents = response.events;
  const events = [];
  const pastEvents = [];

  allEvents.map(event => {
    const today = new Date();
    const serverHoursOffset = today.getTimezoneOffset() / 60;

    const timeZoneHours = timeZoneToHours(event.timeZone);
    today.setHours(today.getHours() + timeZoneHours + serverHoursOffset);
    const eventDate = new Date(event.dateAndTime);
    event.utcTime = eventDate.getTime();

    if (eventDate < today) {
      pastEvents.push(event);
    } else {
      events.push(event);
    }
  });
  response.events = events;
  response.pastEvents = pastEvents;
};

const compareEvents = (a, b) => {
  const dateA = new Date(a.dateAndTime);
  const dateB = new Date(b.dateAndTime);
  if (dateA > dateB) {
    return 1;
  }
  if (dateA < dateB) {
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
