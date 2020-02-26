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
      } else if (itemId === 'presidentialCandidate') {
        if (!mappedResponse.presidentialCandidates) {
          mappedResponse.presidentialCandidates = [];
        }
        mappedResponse.presidentialCandidates.push({
          info: item.fields.info,
          name: item.fields.name,
        });
      }
    }
  });
  // need to order the event chronologically and separate the past events.
  mappedResponse.events.sort(compareEvents);
  splitPastEvents(mappedResponse);
  return mappedResponse;
};
//
// const mapAppPartyScreen = fields => {
//   const flatResponse = {};
//   const {
//     quotes,
//     section1Header,
//     section1Paragraph,
//     section2Header,
//     section2Paragraph,
//     videoPlaceholder,
//     video,
//     section3Header,
//     section3Paragraph,
//   } = fields;
//
//   flatResponse.quotes = mapQuotes(quotes);
//   flatResponse.section1Header = extendText(section1Header);
//   flatResponse.section2Header = extendText(section2Header);
//   flatResponse.section3Header = extendText(section3Header);
//   flatResponse.section1Paragraph = extendText(section1Paragraph);
//   flatResponse.section2Paragraph = extendText(section2Paragraph);
//   flatResponse.section3Paragraph = extendText(section3Paragraph);
//   flatResponse.videoPlaceholder = extractMediaFile(videoPlaceholder);
//   flatResponse.videoPlaceholderDimensions = extractImageDimensions(
//     videoPlaceholder,
//   );
//   flatResponse.video = extractMediaFile(video);
//
//   // console.log(flatResponse);
//
//   return flatResponse;
// };

// const mapQuotes = quotes => {
//   const flatQuotes = [];
//   quotes.map(quote => {
//     flatQuotes.push(quote.fields);
//   });
//   return flatQuotes;
// };

// const mapCandidate = fields => {
//   const flatResponse = {};
//   const { name, role, bio, site, districtNumber, state, avatarPhoto } = fields;
//   flatResponse.name = name;
//   flatResponse.role = role;
//   flatResponse.bio = extendText(bio);
//   flatResponse.site = site;
//   flatResponse.districtNumber = districtNumber;
//   flatResponse.state = state;
//   flatResponse.avatarPhoto = extractMediaFile(avatarPhoto);
//
//   return flatResponse;
// };

const mapEvent = (fields, id) => {
  const flatResponse = {};
  const {
    title,
    dateAndTime,
    description,
    timeZone,
    eventDuration,
    presenter,
  } = fields;
  if (presenter) {
  }

  flatResponse.id = id;
  flatResponse.title = title;
  flatResponse.dateAndTime = dateAndTime;
  flatResponse.description = description;
  flatResponse.timeZone = timeZone;
  flatResponse.eventDuration = eventDuration;
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

// const extractImageDimensions = img => {
//   if (img && img.fields && img.fields.file) {
//     return img.fields.file.details.image;
//   }
//   return null;
// };
//
// const extendText = text => {
//   if (!text) {
//     return text;
//   }
//
//   // replace *text* with <Text style={{fontWeight="bold"}}>text</Text>
//   const bold = /\*(.*?)\*/gim;
//   const boldedText = text.replace(bold, function($0, $1) {
//     return $1 ? '<Text style={{fontWeight: "bold"}}>' + $1 + '</Text>' : $0;
//   });
//
//   // replace :tgp with <Image /> tag
//   return boldedText.replace(
//     /:tgp/g,
//     '<Image source={{ uri: "https://assets.thegoodparty.org/heart-text.png"}} resizeMode="contain" style={{height: 20, width: 20 }}  />',
//   );
// };
