const contentful = require('contentful');

module.exports = {
  friendlyName: 'helper for fetching content from contentful cms',
  description:
    'Contentful api. https://www.contentful.com/developers/docs/references/content-delivery-api/',

  inputs: {},

  exits: {
    success: {
      description: 'Returns ok response from api/responses/ok.js',
      responseType: 'ok',
    },
  },

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
  console.log(JSON.stringify(items));
  items.map((item, index) => {
    if (item && item.sys && item.sys.contentType && item.sys.contentType.sys) {
      const itemId = item.sys.contentType.sys.id;
      if (itemId === 'appPartyScreen') {
        mappedResponse.appPartyScreen = mapAppPartyScreen(item.fields);
      } else if (itemId === 'candidate') {
        if (!mappedResponse.candidates) {
          mappedResponse.candidates = [];
        }
        mappedResponse.candidates.push(mapCandidate(item.fields));
      } else if (itemId === 'mapClickArea') {
        if (!mappedResponse.mapClickArea) {
          mappedResponse.mapClickArea = [];
        }
        mappedResponse.mapClickArea.push(item.fields);
      } else if (itemId === 'faqArticle') {
        if (!mappedResponse.faqArticles) {
          mappedResponse.faqArticles = [];
        }
        // front end needs an id.
        mappedResponse.faqArticles.push({ ...item.fields, id: index + '' });
      }
    }
  });

  return mappedResponse;
};

const mapAppPartyScreen = fields => {
  const flatResponse = {};
  const { header } = fields;
  flatResponse.header = header;

  return flatResponse;
};

const mapCandidate = fields => {
  const flatResponse = {};
  const { name, role, bio, site, districtNumber, state, avatarPhoto } = fields;
  flatResponse.name = name;
  flatResponse.role = role;
  flatResponse.bio = bio;
  flatResponse.site = site;
  flatResponse.districtNumber = districtNumber;
  flatResponse.state = state;
  if (avatarPhoto && avatarPhoto.fields && avatarPhoto.fields.file) {
    flatResponse.avatarPhoto = avatarPhoto.fields.file.url;
  }

  return flatResponse;
};
