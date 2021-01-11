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
    return -1;
  }
  if (dateA < dateB) {
    return 1;
  }
  return 0;
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

const c = [
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '4CrRDuyTqip7XK7DdK4tq7',
      type: 'Entry',
      createdAt: '2021-01-08T22:10:16.397Z',
      updatedAt: '2021-01-09T22:04:47.429Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'articleCategory' },
      },
      locale: 'en-US',
    },
    fields: { name: 'How The Good Party Works', order: 1 },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '1ic6T6fhH0jZLNvX5aZkDe',
      type: 'Entry',
      createdAt: '2020-05-01T07:03:46.910Z',
      updatedAt: '2021-01-08T22:10:57.392Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 35,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'What is a crowd-voting campaign?',
      articleBody: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'A crowd-voting campaign is a way to make votes matter more than money.  ',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "Crowd-voting empowers people to rally around all candidates they like to see if it's possible to get them elected by spreading the word and enlisting others to pledge their votes, rather than just asking people to donate money and then cast their votes in isolation.",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Each crowd-voting campaign brings much needed transparency to an election by showing ',
                nodeType: 'text',
              },
              {
                data: { uri: '?article=4qI5UjYbJmivzBOy1y74Z4' },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'how many votes are needed to win',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  ', and how many other likely voters there are for a candidate.  ',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'In this way, ', nodeType: 'text' },
              {
                data: { uri: '?article=prGq4SAFpfT7qzBFM1HDy' },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'nobody ever has to worry about wasting their vote',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  ', because everyone knows if a candidate they like can can win ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'italic' }, { type: 'bold' }],
                value: 'before anyone goes out and actually votes!',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "So, for the first time ever, people can join crowd-voting campaigns for ALL candidates they like and truly explore all their  options -- not just pick the 'lesser of two evil' candidates approved by red or blue.  ",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "It's important to note that there is no cost or downside to joining a crowd-voting campaign using The Good Party.  Every crowd-voting campaign on The Good Party is absolutely free for both people and candidates.",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
      pages: ['election', 'district'],
      category: [
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '4CrRDuyTqip7XK7DdK4tq7',
            type: 'Entry',
            createdAt: '2021-01-08T22:10:16.397Z',
            updatedAt: '2021-01-09T22:04:47.429Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 2,
            contentType: {
              sys: {
                type: 'Link',
                linkType: 'ContentType',
                id: 'articleCategory',
              },
            },
            locale: 'en-US',
          },
          fields: { name: 'How The Good Party Works', order: 1 },
        },
      ],
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5rNQ7AbDebbvsm0078gPXg',
      type: 'Entry',
      createdAt: '2020-03-26T08:54:46.617Z',
      updatedAt: '2020-10-13T01:00:38.476Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 29,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Why is Bernie Sanders listed as a Write-in Candidate?',
      articleBody: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders is listed "As a Write-in," because regardless of what the two major parties would have you believe, the election does not only happen during their primaries! ',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "Under the current system, the choices on the November ballot are basically decided by the two major parties' power brokers who limit the number of real choices. This cuts third-party, independent and even promising red and blue candidates out of the process months before most voters even begin paying attention to the election. ",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'However, we are offering a ',
                nodeType: 'text',
              },
              {
                data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'crowd-voting campaign',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  ' for Bernie Sanders to see if he can get enough likely votes to win the real election on November 3rd, 2020, ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }, { type: 'italic' }],
                value: 'before any actual votes are cast! ',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'This way, without wasting a single vote, "we the people" get to see if Bernie is truly electable before we vote. And rest assured that we will only activate a voting bloc to vote, if we doubly confirm that we have all the votes we need to win the election.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'That said, if the Bernie crowd-voting campaign doesn\'t get enough votes to win, we stand down and let people know, so they can vote "the lessor of two evils" between red or blue mainstream candidates, or stay on the sidelines, if they choose.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "Growing any write-in presidential candidate's crowd-voting campaign enough to ensure a win would be totally unprecedented in modern times. However, good ideas do spread quickly online. ",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'So, why not try?  What have we got to lose?',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
      pages: ['election'],
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '6hAGPS5PWOZnqvOER2jaj7',
      type: 'Entry',
      createdAt: '2020-03-10T08:09:17.790Z',
      updatedAt: '2020-10-08T20:05:30.208Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 74,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'partyPage' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Header Content',
      content: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'heading-3',
            content: [
              {
                nodeType: 'text',
                value: 'About The Good Party:',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'The Good Party is ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'not',
                marks: [{ type: 'italic' }],
                data: {},
              },
              {
                nodeType: 'text',
                value:
                  " a political party. It's a way to take back our democracy from corrupt big-money politicians of ",
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'both',
                marks: [{ type: 'underline' }],
                data: {},
              },
              {
                nodeType: 'text',
                value:
                  ' major parties.  Our mission is to make votes matter more than money in our democracy.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'We use technology to run ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'crowd-voting campaigns',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
              },
              {
                nodeType: 'text',
                value:
                  ' that turn grass-roots supporters into voters. So anyone with great ideas can run for office and get elected, without becoming beholden to big-money sources and their special interests.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'We are a zero-revenue, mostly volunteer effort, calling on ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'creators of the world',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: 'https://thegoodparty.org/creators' },
              },
              {
                nodeType: 'text',
                value:
                  ' to join and help us build state-of-the-art, free, open-source technology and tools. Together we are empowering anyone with a smartphone and private messaging to organize and multiply their impact by voting as a group.  ',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'Our first step is setting up crowd-voting campaigns for ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'potentially good candidates',
                    marks: [],
                    data: {},
                  },
                ],
                data: {
                  uri:
                    'https://thegoodparty.org/party?article=5KnBx42FOEVDJNUFpoU1PX',
                },
              },
              {
                nodeType: 'text',
                value:
                  ' running for Congress to see if any grow organically, and show that votes still matter more than money.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'This solves two important challenges: it helps underdog candidates turn their supporters into actual voters; and it allows potential voters to band together and see if they have ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'the number of votes needed to win',
                    marks: [],
                    data: {},
                  },
                ],
                data: {
                  uri:
                    'https://thegoodparty.org/party?article=4qI5UjYbJmivzBOy1y74Z4',
                },
              },
              { nodeType: 'text', value: ', ', marks: [], data: {} },
              {
                nodeType: 'text',
                value: 'before',
                marks: [{ type: 'italic' }, { type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: ' anyone goes out and actually votes!  ',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "It's like a kickstarter for democracy, so ensuring no wasted energy or votes, as we work to change politics for ",
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'Good!',
                marks: [{ type: 'bold' }, { type: 'italic' }],
                data: {},
              },
              { nodeType: 'text', value: ' ', marks: [], data: {} },
            ],
            data: {},
          },
          {
            nodeType: 'heading-3',
            content: [
              { nodeType: 'text', value: 'How it works:', marks: [], data: {} },
            ],
            data: {},
          },
          {
            nodeType: 'ordered-list',
            content: [
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value:
                          "See potentially good candidates who aren't beholden to big money.",
                        marks: [],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value:
                          'Join crowd-voting campaigns for all of the candidates you like.',
                        marks: [],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value:
                          'Share with others and see if any get enough crowd votes to win, before you cast your ballot.',
                        marks: [],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [{ nodeType: 'text', value: '', marks: [], data: {} }],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5YnyOUU7NVOihcos0oR1kL',
      type: 'Entry',
      createdAt: '2020-07-19T16:06:40.878Z',
      updatedAt: '2020-10-08T13:48:47.022Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 3,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title:
        "If you're all about indie and grassroots candidates, why do you have so many Democrats and Republicans?",
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'The short answer is that we need to create a bridge to something better.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "The current system - which is designed by the elected officials of the two major parties - makes it nearly impossible for alternative candidates to get on the ballot. In fact, they deliberately limit choice because they don't want the competition. That's why you almost never see independents or third-parties get elected. ",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'That means today, good people who want to serve as honest representatives often have to pick either red or blue, just to have a reasonable shot to get on the ballot - even if they view themselves as independent or not totally aligned with Democrats and Republicans. ',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "That said, we believe people are generally Good, but power and money corrupt. That's where our Follow the Money and Character Check come in. We don't care if a candidate is labelled Red or Blue, incumbent or challenger. As long as they are civil people, trying to honestly represent their district, and are not beholden to big money sources for their funding, we'll list them as Potentially Good candidates for you to support.",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '48a7xazZc0eN4PXM20Jtel',
      type: 'Entry',
      createdAt: '2020-02-23T07:52:06.840Z',
      updatedAt: '2020-10-08T13:41:38.558Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 23,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Is The Good Party a real political party?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'No. The Good Party is not an actual political party. We are a free non-commercial platform and set of open-source tools, being built by a ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'diverse, mostly volunteer team',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=33lnRLO7M0gvfqVkoVxADO' },
              },
              {
                nodeType: 'text',
                value: '. Our app allow voters to organize ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'crowd-voting campaigns',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
              },
              {
                nodeType: 'text',
                value:
                  ' that gather organic momentum and allow good candidates with great ideas to get elected elected. ',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'Our mission is to make votes matter more than money, by providing the latest technology and tools that empower ordinary people to actively participate and have impact on democracy. ',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'Our first step is disrupting the existing two-party dominated political industrial complex by giving indie or grass-roots candidates a path to being elected - without having to depend on big money sources or toxic partisan politics. We do this by showcasing grass-roots candidates, and providing a crowd-voting platform that helps people spread the word and turn social media supporters into actual voters.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'We are organized as under I.R.C. Section 527 as a non-profit, tax exempt, political action committee, but ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'we run more like a technology start-up',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=33lnRLO7M0gvfqVkoVxADO' },
              },
              {
                nodeType: 'text',
                value:
                  ' that has a public good interest, rather than a profit motive.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
      pages: ['party'],
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '4AupMs228xSHleBULCVdqa',
      type: 'Entry',
      createdAt: '2020-06-02T21:57:59.862Z',
      updatedAt: '2020-10-08T13:39:20.963Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 10,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title:
        'How do you ensure your crowd-voting campaigns can turn out actual voters?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'As people join crowd-voting campaigns, we help them get voterized and get ready to vote by:',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'ordered-list',
            content: [
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value: 'Checking their voter registration status.',
                        marks: [],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value: 'Registering to vote (as needed).',
                        marks: [],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value:
                          'Request their vote by mail ballots, or find their nearest polling locations.',
                        marks: [],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'As we do that, all others in the crowd-voting campaign can see the progress and get excited about the possibility of winning.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'Once we have enough likely voters that we can guaranteed a win, we start the process of getting out the vote, and having campaign members share peer-to-peer their "I voted for Good" online stickers, reaching out to their friends to do the same.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "The reason you don't see all those additional steps up front, is two-fold:",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'ordered-list',
            content: [
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value:
                          'Today, everyone (regardless of voter registration status) should be able to join a crowd-voting campaign and support a candidate, by spreading the word and helping the campaign grow virally.',
                        marks: [],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value:
                          'We have limited resources and focused on deploying the core functionality first. Now we are working feverishly to build the get out the vote components before election day.',
                        marks: [],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'If this excites you and you can help, ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'please consider volunteering with us',
                    marks: [],
                    data: {},
                  },
                ],
                data: {
                  uri:
                    "mailto:ask@thegoodparty.org?subject=I'm interested!&body=[Include Bio and area of interest]",
                },
              },
              {
                nodeType: 'text',
                value: ', and help fix politics for Good! 🙏',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [{ nodeType: 'text', value: '', marks: [], data: {} }],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: 'prGq4SAFpfT7qzBFM1HDy',
      type: 'Entry',
      createdAt: '2020-05-01T03:03:31.379Z',
      updatedAt: '2020-10-08T13:37:38.909Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 20,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'We never waste your vote!',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'The Good Party allows people to join ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'crowd-voting campaigns',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
              },
              { nodeType: 'text', value: ' ', marks: [], data: {} },
              {
                nodeType: 'hyperlink',
                content: [{ nodeType: 'text', value: '', marks: [], data: {} }],
                data: {
                  uri:
                    'https://thegoodparty.org/party/faq/what-is-a-candidate-votingbloc/1ic6T6fhH0jZLNvX5aZkDe',
                },
              },
              {
                nodeType: 'text',
                value:
                  "and to track each campaign's growth to see if any candidate they like has a chance to win. This means that for the first time in history, people can actually see how many people are willing to vote together with them for a candidate they like, ",
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'before',
                marks: [{ type: 'bold' }, { type: 'italic' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: ' anyone actually votes!',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'The idea is to never waste a vote! The Good Party only activates and coordinates a group vote if we have enough votes to guarantee victory in advance.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'Otherwise, we just notify everyone that the crowd-voting campaign came up short, and let everyone vote for the lesser of two evils between other candidates.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '30epU8vSgh9SeSnfGJmsDc',
      type: 'Entry',
      createdAt: '2020-06-02T14:27:13.966Z',
      updatedAt: '2020-10-08T13:31:39.268Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 4,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title:
        'Do you have crowd-voting campaigns for primary and local elections?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'Not yet. We are a small team and have decided to focus on just the Federal level, General Elections, where we can prove the voting blocs concept and have most impact.   ',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "So for this election we're focused on the U.S President, U.S. Senate, and U.S. House of Representatives races. That still represents over 470 races, and thousands of candidates.",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'That said, our mission is to build an open-source, free, decentralized and non-commercial democracy that can be used by people across the whole world.  ',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: "The Good Party's ",
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'crowd-voting platform',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
              },
              {
                nodeType: 'text',
                value:
                  " is a fundamental feature that's designed to be applicable to all democratic elections. And, we have a ton of features and enhancements in the works.   ",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'So, yes, we plan to have U.S. state and local elections, plus all their associated primaries are on our roadmap down the line.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "We're hopeful that as this good idea spreads, volunteer developers from all over will join us and help us build out The Good Party to what it must be: a freely available, decentralized, non-commercial public good that helps upgrade democracy for all.",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '3yMjX3IPC2yIF3fj5rtbrq',
      type: 'Entry',
      createdAt: '2020-02-23T07:54:13.780Z',
      updatedAt: '2020-10-08T13:29:14.080Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 12,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'What is the Write-in Vote?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'The Write-in Vote is a rarely used feature of the election system in the United States, which has been with us since the founding of the country. Just as it sounds, the write-in vote allows people to literally ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'write-in',
                marks: [{ type: 'italic' }],
                data: {},
              },
              {
                nodeType: 'text',
                value:
                  " the name of a preferred candidate if they don't like the names who are on the ballot.",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "The reason this feature is infrequently used is that it is very hard to coordinate enough people to write-in the same name and actually get someone elected, and many voters fear it's a wasted vote. However, the power of the write-in vote is that in elections where the two-party system has effectively locked out good grass-roots or indie candidates, we can still write-in any legit candidate's name and get them elected.",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "Now, for the first time in history, by using The Good Party's app and joining ",
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'crowd-voting campaigns',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
              },
              {
                nodeType: 'text',
                value:
                  ', we will finally be able to coordinate an effective write-in vote, and be sure that, ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'before anyone fills out their ballot, ',
                marks: [{ type: 'bold' }, { type: 'italic' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'we have enough votes to guarantee a win.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '33lnRLO7M0gvfqVkoVxADO',
      type: 'Entry',
      createdAt: '2020-01-21T02:06:30.974Z',
      updatedAt: '2020-10-08T13:16:43.894Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 29,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Who is behind The Good Party?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'The Good Party is a non-profit, open-source project, run by a ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'passionate and diverse team',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=579kihjyIPloNaEw02rniq' },
              },
              {
                nodeType: 'text',
                value:
                  '. We believe that people are good and if empowered by technology, instead of enslaved by it, we can create a much better world for all. ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  { nodeType: 'text', value: 'Our logo', marks: [], data: {} },
                ],
                data: { uri: '?article=U4dbmGezqNUIDdGriL5oA' },
              },
              {
                nodeType: 'text',
                value: ' hints at our motives!',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "We believe that commercial interests and power motives often undercut the vast potential of technology to help humanity. So, we've removed both money and power as motives and set ourselves up as a non-profit, open source project, where as many people as possible can be ",
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'pro bono',
                marks: [{ type: 'italic' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: ' contributors and volunteers.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "This way, we can all just focus on building the best platform possible needed to take on humanity's biggest barrier to progress: the corruption of money and power in politics. The current system allows corrupt career politicians of either major party to hold onto power, election after election, setting the rules of society to benefit themselves and the big money sources that paid to get them elected.",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "Our mission is enormous and exciting: We're building a free, open, non-commercial foundational platform that upgrades the infrastructure of democracy everywhere. ",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "We're trying to make possible a kind of civic tour of duty, where good, ordinary, capable people can step up and serve as honest representatives. Where people can be given a chance to truly serve society and move everyone towards a more just and sustainable future. There are several steps to get there, but it starts with this simple Good Party app we offer you today.",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "The Good Party's main financial backing to date has come from one of our project co-founders, ",
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [{ nodeType: 'text', value: '', marks: [], data: {} }],
                data: { uri: 'https://farhadmohit.com' },
              },
              {
                nodeType: 'text',
                value:
                  'who is also a full-time volunteer here. We are committed to being open and transparent in all matters. You can see our disclosures here at ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'The Good Party Financial Summary',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: 'https://www.fec.gov/data/committee/C00707398/' },
              },
              {
                nodeType: 'text',
                value: ' on the Federal Election Commission (FEC) website.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'The Good Party seeks as many diversely talented creative people as possible to help us build something truly good!  ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Interested? Ping us!',
                    marks: [],
                    data: {},
                  },
                ],
                data: {
                  uri:
                    "mailto:ask@thegoodparty.org?subject=I'm interested!&body=[Include Bio and area of interest]",
                },
              },
              { nodeType: 'text', value: '', marks: [], data: {} },
            ],
            data: {},
          },
        ],
      },
      pages: ['party'],
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '579kihjyIPloNaEw02rniq',
      type: 'Entry',
      createdAt: '2020-04-17T23:02:00.645Z',
      updatedAt: '2020-10-07T22:31:47.714Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 15,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Our team',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'heading-3',
            content: [
              {
                nodeType: 'text',
                value: 'The Good Party Crew',
                marks: [{ type: 'bold' }],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Tomer Almog',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: {
                  uri: 'https://www.linkedin.com/in/tomer-almog-742b6b40/',
                },
              },
              {
                nodeType: 'text',
                value: ' - Engineering',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Peter Asaro',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: {
                  uri: 'https://www.linkedin.com/in/peter-asaro-a0a725191/',
                },
              },
              {
                nodeType: 'text',
                value: ' - Engineering',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Kai Gradert',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://www.linkedin.com/in/kaigradert/' },
              },
              {
                nodeType: 'text',
                value: ' - Product / Design',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              { nodeType: 'text', value: '', marks: [], data: {} },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Nick Greene',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://www.linkedin.com/in/njdgx/' },
              },
              { nodeType: 'text', value: ' - Product', marks: [], data: {} },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Farhad Mohit',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://www.linkedin.com/in/farhad667/' },
              },
              { nodeType: 'text', value: ' - Product', marks: [], data: {} },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Cameron Sadeghi',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: {
                  uri: 'https://www.linkedin.com/in/cameron-sadeghi-9662081b/',
                },
              },
              {
                nodeType: 'text',
                value: ' - Politics Associate',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              { nodeType: 'text', value: '', marks: [], data: {} },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Dan Shipley',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://www.linkedin.com/in/danielshipley/' },
              },
              {
                nodeType: 'text',
                value: ' - Design / User Experience',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Zak Tomich',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://www.linkedin.com/in/zaktomich/' },
              },
              {
                nodeType: 'text',
                value: ' - Political Strategy / Operations',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'heading-4',
            content: [
              {
                nodeType: 'text',
                value: 'Good Party Volunteers',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Jared Alper',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: {
                  uri: 'https://www.linkedin.com/in/jared-alper-00606093/',
                },
              },
              {
                nodeType: 'text',
                value: ' - Political Data',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Navid Aslani',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://www.linkedin.com/in/navidaslani/' },
              },
              {
                nodeType: 'text',
                value: ' ',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: '- HR / Operations',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Kam Kafi',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://www.linkedin.com/in/kamkafi/' },
              },
              {
                nodeType: 'text',
                value: ' - Creator Relations',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: "Brian O'Neil",
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: {
                  uri: 'https://www.linkedin.com/in/brian-o-neil-a8b5283/',
                },
              },
              {
                nodeType: 'text',
                value: ' - HR / FEC / Finance',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              { nodeType: 'text', value: '', marks: [], data: {} },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Jean Rousseau',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://www.linkedin.com/in/jeanrousseau/' },
              },
              {
                nodeType: 'text',
                value: ' ',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: '- Field Operations',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'Interested in joining us? \n💪 ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: ' ',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Get in touch! ',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: {
                  uri:
                    'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=sf_link',
                },
              },
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: 'kzQdSmGDWygkx0AMZSB4O',
      type: 'Entry',
      createdAt: '2020-08-27T01:42:54.266Z',
      updatedAt: '2020-10-07T21:17:45.322Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 5,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Nerds for Humanity',
      dateAndTime: '2020-08-09T12:00',
      displayDate: 'Sun August 9th 2020 · 12:00pm PT (3:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '3s6RGkEXCOqpO1YNB0jdML',
          type: 'Entry',
          createdAt: '2020-10-07T21:11:24.192Z',
          updatedAt: '2020-10-07T21:11:24.192Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Tom Leung',
          title: 'Nerds for Humanity',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '1sFTbKG2aeT5i4B4ovY3mh',
              type: 'Asset',
              createdAt: '2020-10-07T21:10:34.879Z',
              updatedAt: '2020-10-07T21:10:34.879Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 1,
              locale: 'en-US',
            },
            fields: {
              title:
                'nerds-for-humanity-tom-leung-B5jg4RqrPAa-znC2QTwWEba.1400x1400',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/1sFTbKG2aeT5i4B4ovY3mh/c4e712af4e99fd151a1aee2027c5221a/nerds-for-humanity-tom-leung-B5jg4RqrPAa-znC2QTwWEba.1400x1400.jpg',
                details: { size: 282573, image: { width: 1400, height: 1400 } },
                fileName:
                  'nerds-for-humanity-tom-leung-B5jg4RqrPAa-znC2QTwWEba.1400x1400.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://youtu.be/GbrmrQsLtTI',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '34cXpKF58K6v0M7ANHfvIt',
      type: 'Entry',
      createdAt: '2020-08-20T04:10:23.009Z',
      updatedAt: '2020-10-07T21:14:32.032Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 7,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-08-26T17:00',
      displayDate: 'Wed, Aug 26th 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party--20200826',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '3s6RGkEXCOqpO1YNB0jdML',
      type: 'Entry',
      createdAt: '2020-10-07T21:11:24.192Z',
      updatedAt: '2020-10-07T21:11:24.192Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 1,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Tom Leung',
      title: 'Nerds for Humanity',
      avatarPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '1sFTbKG2aeT5i4B4ovY3mh',
          type: 'Asset',
          createdAt: '2020-10-07T21:10:34.879Z',
          updatedAt: '2020-10-07T21:10:34.879Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title:
            'nerds-for-humanity-tom-leung-B5jg4RqrPAa-znC2QTwWEba.1400x1400',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/1sFTbKG2aeT5i4B4ovY3mh/c4e712af4e99fd151a1aee2027c5221a/nerds-for-humanity-tom-leung-B5jg4RqrPAa-znC2QTwWEba.1400x1400.jpg',
            details: { size: 282573, image: { width: 1400, height: 1400 } },
            fileName:
              'nerds-for-humanity-tom-leung-B5jg4RqrPAa-znC2QTwWEba.1400x1400.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '1K3juU2PWJW13TMjNVn8LN',
      type: 'Entry',
      createdAt: '2020-09-10T13:37:20.749Z',
      updatedAt: '2020-10-07T21:02:53.167Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 10,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Future of Democracy - interview with Paget Kagy',
      dateAndTime: '2020-09-15T15:00',
      displayDate: 'Tues, Sept 15th 2020 · 3:00pm PT (6:00pm ET)',
      timeZone: 'PST',
      description: 'Watch our interview with write and actress Paget Kagy.',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '50AyMfl9bL36oD6YphS4bP',
          type: 'Entry',
          createdAt: '2020-09-25T17:20:21.822Z',
          updatedAt: '2020-09-25T17:20:21.822Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Paget Kagy',
          title: 'Writer. Actress. Creator of #KatLovesLA',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '135mfnF7NAnYoffq9WwCNe',
              type: 'Asset',
              createdAt: '2020-09-25T17:20:10.319Z',
              updatedAt: '2020-09-25T17:24:01.643Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Paget Kagy',
              description: 'Writer. Actress. Creator of #KatLovesLA',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/135mfnF7NAnYoffq9WwCNe/cb9be11f94bf25a5c727e56579101b1b/undefined',
                details: { size: 105207, image: { width: 800, height: 800 } },
                fileName:
                  'MV5BMmFhYjZlNjEtMDQyMy00OTMxLWE0M2UtYWI5ZDlhYTlhZWZlXkEyXkFqcGdeQXVyMjEyMTQ2OTA@._V1_.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://youtu.be/wFUaK-rdzTk',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '50AyMfl9bL36oD6YphS4bP',
      type: 'Entry',
      createdAt: '2020-09-25T17:20:21.822Z',
      updatedAt: '2020-09-25T17:20:21.822Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 1,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Paget Kagy',
      title: 'Writer. Actress. Creator of #KatLovesLA',
      avatarPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '135mfnF7NAnYoffq9WwCNe',
          type: 'Asset',
          createdAt: '2020-09-25T17:20:10.319Z',
          updatedAt: '2020-09-25T17:24:01.643Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          locale: 'en-US',
        },
        fields: {
          title: 'Paget Kagy',
          description: 'Writer. Actress. Creator of #KatLovesLA',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/135mfnF7NAnYoffq9WwCNe/cb9be11f94bf25a5c727e56579101b1b/undefined',
            details: { size: 105207, image: { width: 800, height: 800 } },
            fileName:
              'MV5BMmFhYjZlNjEtMDQyMy00OTMxLWE0M2UtYWI5ZDlhYTlhZWZlXkEyXkFqcGdeQXVyMjEyMTQ2OTA@._V1_.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: 'h2WaVMyZt4ZXPsILFmqTQ',
      type: 'Entry',
      createdAt: '2019-11-30T23:34:23.202Z',
      updatedAt: '2020-08-20T04:29:52.921Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 56,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Livestream + Q&A - REPLAY',
      dateAndTime: '2020-08-12T17:00',
      displayDate: 'Wed, Aug 12th 2020 · 5:00PM PT (8:00PM ET)',
      timeZone: 'PST',
      description:
        "Learn what Good we're up to and ask us any questions, live!",
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200812',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '7lPcqnsIV57JwqjhZr90aN',
      type: 'Entry',
      createdAt: '2020-08-13T00:59:11.211Z',
      updatedAt: '2020-08-20T04:26:54.267Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 4,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-08-19T17:00',
      displayDate: 'Wed, Aug 19th 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200819',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '2mQ653btWiiDfgA2KWAmDM',
      type: 'Entry',
      createdAt: '2020-08-07T01:48:52.798Z',
      updatedAt: '2020-08-07T01:49:49.782Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-08-08T10:00',
      displayDate: 'Sat, Aug 8th 2020 · 10:00am PT (1:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200806',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '2gcX2qW4192bVAlM40saZ8',
      type: 'Entry',
      createdAt: '2020-07-30T01:25:49.618Z',
      updatedAt: '2020-07-30T01:25:49.618Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 1,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-07-29T17:00',
      displayDate: 'Weds, July 29th, 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200729',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '3IWsmL227uDT0MKhqBwurB',
      type: 'Entry',
      createdAt: '2020-07-23T01:49:00.106Z',
      updatedAt: '2020-07-23T01:51:56.473Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-07-22T17:00',
      displayDate: 'Weds, July 22nd, 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200722',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '1WySOjytc8dr1dzBzKyfxN',
      type: 'Entry',
      createdAt: '2020-04-13T21:28:11.727Z',
      updatedAt: '2020-07-21T20:25:01.358Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 19,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'appVersion' },
      },
      locale: 'en-US',
    },
    fields: { version: '1.0.19' },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5bwvf0PwsbpFEe8IJ9sHhX',
      type: 'Entry',
      createdAt: '2020-05-23T18:17:31.158Z',
      updatedAt: '2020-07-19T15:51:57.278Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'What is hate-speech?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'The Good Party goes with the ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'U.N. definition of hate-speech',
                    marks: [],
                    data: {},
                  },
                ],
                data: {
                  uri:
                    'https://www.un.org/en/genocideprevention/documents/UN%20Strategy%20and%20Plan%20of%20Action%20on%20Hate%20Speech%2018%20June%20SYNOPSIS.pdf',
                },
              },
              {
                nodeType: 'text',
                value:
                  ' as any kind of communication in speech, writing or behavior, that attacks or uses pejorative or discriminatory language with reference to a person or a group on the basis of who they are. In other words, based on their religion, ethnicity, nationality, race, color, descent, gender or other identity factor.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'We look for a pattern of behavior and also make sure that we include hate-speech against any ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value:
                      'constitutionally and state-protected groups and classes',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: 'https://en.wikipedia.org/wiki/Protected_group' },
              },
              {
                nodeType: 'text',
                value: ' in the United States.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '7Mrfo6spgrgpwAFe83Oph4',
      type: 'Entry',
      createdAt: '2020-01-21T02:10:36.100Z',
      updatedAt: '2020-07-19T15:50:50.928Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 6,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title:
        'Does joining The Good Party app impact my ability to vote in primaries or for other candidates?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'No. Your party affiliation and vote are always yours and you always have the choice to vote for whomever you like in the primaries or General Election. The Good Party app just allows you to see your options ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'before ',
                marks: [{ type: 'italic' }, { type: 'bold' }],
                data: {},
              },
              { nodeType: 'text', value: 'you vote.  ', marks: [], data: {} },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'This way you can see whether your vote can be combined with others to enable you to elect a Good grass-roots or indie candidate you might like more than the establishment candidates who are offered.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '4qI5UjYbJmivzBOy1y74Z4',
      type: 'Entry',
      createdAt: '2020-03-19T23:34:28.101Z',
      updatedAt: '2020-07-19T15:18:03.383Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 16,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'How do you know the number of votes needed to win?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'We use election data and a predictive model to estimate how many votes are needed to guarantee a win for each Federal election across America. We are conservative with our estimates to ensure that we never end up with a false-positive. So we can confidently say we will never waste a single vote.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'heading-3',
            content: [
              {
                nodeType: 'text',
                value: 'Our Data & Model:',
                marks: [{ type: 'bold' }],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              { nodeType: 'text', value: 'Thanks to ', marks: [], data: {} },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: "MIT's Election Lab",
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: 'https://electionlab.mit.edu/data' },
              },
              {
                nodeType: 'text',
                value:
                  ', we have access to comprehensive voting data from all Federal elections since 1976. We have used this data to create a model that helps us predict just how many votes we need to win any race in 2020.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'Admittedly, our model is relatively simplistic today. For instance, due to the ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Electoral College rules',
                    marks: [],
                    data: {},
                  },
                ],
                data: {
                  uri:
                    'https://en.wikipedia.org/wiki/United_States_Electoral_College',
                },
              },
              {
                nodeType: 'text',
                value:
                  ', winning the Presidential election requires more than just getting enough of the popular vote. So, our current model is not adequate much beyond just getting us started... and it will continue to improve and get better over time.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'Good spot to help if you can: ',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value:
                  'If you are a politically-minded data scientist who would be excited to join an open-source effort to try and fix politics for Good, please ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'get in touch',
                    marks: [],
                    data: {},
                  },
                ],
                data: {
                  uri:
                    'mailto:info@thegoodparty.org?subject=Data%20Model%20Team',
                },
              },
              { nodeType: 'text', value: '!', marks: [], data: {} },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '2zn1lYvlEB3sHYwUTeLqyS',
      type: 'Entry',
      createdAt: '2019-12-10T09:54:44.475Z',
      updatedAt: '2020-07-19T15:12:02.609Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 11,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title:
        'If I’m registered as a Democrat or Republican, does joining the Good Party app change anything?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "No. Your party affiliations are not affected in any way. The Good Party is not an official political party. We're a technology platform that shows you voting blocs of the Potentially Good grassroots and indie candidates are in your area, so you can quickly check whether they have enough votes to get elected. ",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'We are only a "good party" in that we offer people a good alternative to the "lesser of two evils," and career politicians offered by the two major parties.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: 'U4dbmGezqNUIDdGriL5oA',
      type: 'Entry',
      createdAt: '2020-06-02T00:20:42.164Z',
      updatedAt: '2020-07-19T15:08:42.370Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 21,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Meaning of our Logo',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'heading-2',
            content: [
              {
                nodeType: 'text',
                value: 'Red, Bright and Blue!',
                marks: [{ type: 'bold' }],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "We are tired of the divisiveness and negativity of both sides of the political establishment. We wanted our logo to immediately convey that we're something positive, different and good. We also want it to feel super-heroic, but at the same time approachable, humble and inviting. We want our logo to actively welcome everyone to join and take part!",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'heading-3',
            content: [
              {
                nodeType: 'text',
                value: 'Our shapes: Heart and Star',
                marks: [{ type: 'bold' }],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'unordered-list',
            content: [
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value: 'Heart as in Human ❤️',
                        marks: [{ type: 'bold' }],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                  {
                    nodeType: 'unordered-list',
                    content: [
                      {
                        nodeType: 'list-item',
                        content: [
                          {
                            nodeType: 'paragraph',
                            content: [
                              {
                                nodeType: 'text',
                                value: 'As in love ',
                                marks: [],
                                data: {},
                              },
                            ],
                            data: {},
                          },
                        ],
                        data: {},
                      },
                      {
                        nodeType: 'list-item',
                        content: [
                          {
                            nodeType: 'paragraph',
                            content: [
                              {
                                nodeType: 'text',
                                value: 'As in life',
                                marks: [],
                                data: {},
                              },
                            ],
                            data: {},
                          },
                        ],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'unordered-list',
            content: [
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value: 'Star as in Freedom ☆ ',
                        marks: [{ type: 'bold' }],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                  {
                    nodeType: 'unordered-list',
                    content: [
                      {
                        nodeType: 'list-item',
                        content: [
                          {
                            nodeType: 'paragraph',
                            content: [
                              {
                                nodeType: 'text',
                                value: 'As in liberty ',
                                marks: [],
                                data: {},
                              },
                            ],
                            data: {},
                          },
                        ],
                        data: {},
                      },
                      {
                        nodeType: 'list-item',
                        content: [
                          {
                            nodeType: 'paragraph',
                            content: [
                              {
                                nodeType: 'text',
                                value: 'As in justice',
                                marks: [],
                                data: {},
                              },
                            ],
                            data: {},
                          },
                        ],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'heading-3',
            content: [
              {
                nodeType: 'text',
                value: 'Our colors: Bright and White',
                marks: [{ type: 'bold' }],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'unordered-list',
            content: [
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value: 'Bright as in Light 🌈',
                        marks: [{ type: 'bold' }],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                  {
                    nodeType: 'unordered-list',
                    content: [
                      {
                        nodeType: 'list-item',
                        content: [
                          {
                            nodeType: 'paragraph',
                            content: [
                              {
                                nodeType: 'text',
                                value: 'The full spectrum of diverse colors',
                                marks: [],
                                data: {},
                              },
                            ],
                            data: {},
                          },
                        ],
                        data: {},
                      },
                      {
                        nodeType: 'list-item',
                        content: [
                          {
                            nodeType: 'paragraph',
                            content: [
                              {
                                nodeType: 'text',
                                value:
                                  'All coming together and shining, as one',
                                marks: [],
                                data: {},
                              },
                            ],
                            data: {},
                          },
                        ],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                  {
                    nodeType: 'paragraph',
                    content: [
                      { nodeType: 'text', value: '', marks: [], data: {} },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
              {
                nodeType: 'list-item',
                content: [
                  {
                    nodeType: 'paragraph',
                    content: [
                      {
                        nodeType: 'text',
                        value: 'White as in Peace 🕊',
                        marks: [{ type: 'bold' }],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                  {
                    nodeType: 'unordered-list',
                    content: [
                      {
                        nodeType: 'list-item',
                        content: [
                          {
                            nodeType: 'paragraph',
                            content: [
                              {
                                nodeType: 'text',
                                value: 'The 3rd color on our flag',
                                marks: [],
                                data: {},
                              },
                            ],
                            data: {},
                          },
                        ],
                        data: {},
                      },
                      {
                        nodeType: 'list-item',
                        content: [
                          {
                            nodeType: 'paragraph',
                            content: [
                              {
                                nodeType: 'text',
                                value: 'The clear alternative to red + blue',
                                marks: [],
                                data: {},
                              },
                            ],
                            data: {},
                          },
                        ],
                        data: {},
                      },
                    ],
                    data: {},
                  },
                ],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "Based on this we have two kinds of stickers, that we'll start distributing soon:",
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'embedded-asset-block',
            content: [],
            data: {
              target: {
                sys: {
                  space: {
                    sys: {
                      type: 'Link',
                      linkType: 'Space',
                      id: 'g08ybc4r0f4b',
                    },
                  },
                  id: '5ltogLmmGOq0CkJCCvqHpt',
                  type: 'Asset',
                  createdAt: '2020-06-02T00:21:40.365Z',
                  updatedAt: '2020-06-02T00:42:44.296Z',
                  environment: {
                    sys: {
                      id: 'master',
                      type: 'Link',
                      linkType: 'Environment',
                    },
                  },
                  revision: 2,
                  locale: 'en-US',
                },
                fields: {
                  title: 'FAQ - Logos',
                  file: {
                    url:
                      '//images.ctfassets.net/g08ybc4r0f4b/5ltogLmmGOq0CkJCCvqHpt/6651d14467ed29ad01852d0b21c2e5ef/For_FAQ.png',
                    details: {
                      size: 106715,
                      image: { width: 727, height: 316 },
                    },
                    fileName: 'For FAQ.png',
                    contentType: 'image/png',
                  },
                },
              },
            },
          },
          {
            nodeType: 'paragraph',
            content: [
              { nodeType: 'text', value: '', marks: [], data: {} },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Which do you like better?',
                    marks: [{ type: 'bold' }, { type: 'underline' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://forms.gle/TGLLL5gqaZadFMCN8' },
              },
              { nodeType: 'text', value: '', marks: [], data: {} },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [{ nodeType: 'text', value: '', marks: [], data: {} }],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '4c0UMRSwDPu5gLSPPxGz4s',
      type: 'Entry',
      createdAt: '2020-01-21T02:13:17.965Z',
      updatedAt: '2020-07-19T14:57:01.164Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 15,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title:
        'Will I be asked to donate money to participate in The Good Party?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'No. The Good Party is free for both users and candidates. We view our service as a vital public good that must stay free, open and non-commercial.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  "If you're wondering how we pay the bills, through volunteer efforts and donations from ",
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'our core team',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=579kihjyIPloNaEw02rniq' },
              },
              { nodeType: 'text', value: '.  ', marks: [], data: {} },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'At some point we may accept outside donations from those who want to help, but for now we have enough resources and volunteers joining to help us build what we need.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'If you want to help, please consider volunteering with us, or telling candidates and friends about The Good Party and help us get more people using the service!',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '4etzzkBH9v6pD8Hl7KpLeL',
      type: 'Entry',
      createdAt: '2020-02-24T05:07:09.522Z',
      updatedAt: '2020-07-19T14:44:51.794Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 11,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Could the Good Party mess up the general election?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'No. We have designed The Good Party specifically ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'not',
                marks: [{ type: 'italic' }],
                data: {},
              },
              {
                nodeType: 'text',
                value:
                  ' to do that. Rather, we let you know if there are enough votes to elect a Good indie or grass-roots candidate, ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'before',
                marks: [{ type: 'bold' }, { type: 'italic' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: ' you actually go out and vote. So, the Good Party ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'never wastes your time or any votes',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=prGq4SAFpfT7qzBFM1HDy' },
              },
              { nodeType: 'text', value: '.', marks: [], data: {} },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'If we haven\'t counted enough votes, we simply let you know so you can vote for the "lesser of two evils" among the major party candidates, or just sit this election out, if you don\'t like anyone enough.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5KnBx42FOEVDJNUFpoU1PX',
      type: 'Entry',
      createdAt: '2020-05-19T22:03:26.257Z',
      updatedAt: '2020-07-19T14:39:25.144Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 30,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'What makes a candidate "Potentially Good?"',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              { nodeType: 'text', value: 'To be a ', marks: [], data: {} },
              {
                nodeType: 'text',
                value: 'Potentially Good ',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'option, a candidate must pass ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'both',
                marks: [{ type: 'underline' }],
                data: {},
              },
              { nodeType: 'text', value: ' our ', marks: [], data: {} },
              {
                nodeType: 'text',
                value: 'Follow the Money',
                marks: [{ type: 'bold' }],
                data: {},
              },
              { nodeType: 'text', value: ' and ', marks: [], data: {} },
              {
                nodeType: 'text',
                value: 'Character Check',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: ' criteria below:',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'heading-3',
            content: [
              {
                nodeType: 'text',
                value: 'Follow the Money',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'Mostly Funded by Small Donors (<$200).',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value:
                  ' Major candidates who have raised lots of funding, but have ensured that most of their funding (>50%) is coming from Small Individual Donors (<$200).',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [{ nodeType: 'text', value: 'or ', marks: [], data: {} }],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'Relatively Small Amount of Funding.',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value:
                  ' Candidates who have raised relatively little funding when compared to the incumbent in race. These are candidates who have raised less than half (<50%) of the funding of the incumbent and are relying on grass-roots campaigning, word-of-mouth and their policy positions to get them elected.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'heading-3',
            content: [
              {
                nodeType: 'text',
                value: 'Character Check',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'Candidate passes our minimum standard of civility, meaning they have been vetted to ensure that they are ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'not',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: ' engaged in a pattern of activities or ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'hate-speech',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=5bwvf0PwsbpFEe8IJ9sHhX' },
              },
              {
                nodeType: 'text',
                value:
                  ' that encourages intolerance, discrimination, hostility or hatred towards a person or group based on constitutionally or state-law protected classes, such as race, religion, color, creed, sexual orientation, age, disability or gender.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
      pages: ['district', 'election'],
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '66i4vRRLkX1yf8MnCQvYSb',
      type: 'Entry',
      createdAt: '2020-05-29T22:49:24.191Z',
      updatedAt: '2020-07-18T03:40:34.003Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 5,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: "What is The Good Party's minimum standard of civility?",
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'We vet all candidates to ensure that they have ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value: 'not',
                marks: [{ type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: ' engaged in a pattern of activities or ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'hate-speech',
                    marks: [],
                    data: {},
                  },
                ],
                data: { uri: '?article=5bwvf0PwsbpFEe8IJ9sHhX' },
              },
              {
                nodeType: 'text',
                value:
                  ' encouraging intolerance, discrimination or hostility towards a constitutionally or state-protected group or class.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '7D3TGoveRpv3RjgAWnefCy',
      type: 'Entry',
      createdAt: '2020-06-03T03:13:36.724Z',
      updatedAt: '2020-07-18T03:39:18.167Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 18,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'How can I learn more about The Good Party?',
      articleBody: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value: 'Join us for a ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'Livestream + Q&A or Watch a Replay',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://thegoodparty.org/party/events' },
              },
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [{ nodeType: 'text', value: 'or', marks: [], data: {} }],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              { nodeType: 'text', value: 'Read our ', marks: [], data: {} },
              {
                nodeType: 'hyperlink',
                content: [
                  {
                    nodeType: 'text',
                    value: 'FAQ',
                    marks: [{ type: 'bold' }],
                    data: {},
                  },
                ],
                data: { uri: 'https://thegoodparty.org/party/faqs' },
              },
              {
                nodeType: 'text',
                value: '',
                marks: [{ type: 'bold' }],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
      pages: ['district', 'election', 'party'],
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '7vf3x4T8q3jhlIzxJsCRWb',
      type: 'Entry',
      createdAt: '2020-07-16T01:43:20.287Z',
      updatedAt: '2020-07-16T01:43:20.287Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 1,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-07-15T17:00',
      displayDate: 'Wednesday, July 15th, 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200715',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '1sshfrfXZan94SvZuKZF0g',
      type: 'Entry',
      createdAt: '2020-07-09T02:12:29.692Z',
      updatedAt: '2020-07-09T02:12:29.692Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 1,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-07-08T17:00',
      displayDate: 'Wednesday, July 8, 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200708',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '6JrcTKnx2WqWg6dbj6iAXI',
      type: 'Entry',
      createdAt: '2020-07-02T01:02:48.842Z',
      updatedAt: '2020-07-02T01:02:48.842Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 1,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-07-01T17:00',
      displayDate: 'Wednesday, July 1, 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200701',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5QNyF0YhTP7RcLaaaVEjSQ',
      type: 'Entry',
      createdAt: '2020-06-25T03:14:17.157Z',
      updatedAt: '2020-06-25T03:14:17.157Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 1,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-06-24T17:00',
      displayDate: 'Wednesday, June 24th, 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200624',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5dUlNNJ2UaIpbUekPkddf',
      type: 'Entry',
      createdAt: '2020-06-12T01:54:37.836Z',
      updatedAt: '2020-06-23T15:18:26.389Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 13,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'creatorsProject' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Candidate Video Introductions',
      summary:
        "I am working on video introductions for each candidate. \n\nThese are 2-minute informational videos (think Wikipedia) that allow people to see what each candidate is about and the positions they take. The videos should maintain an unbiased and dispassionate view of each candidate, focusing on facts, not opinions.\n\nI am looking for collaborators to help improve the videos' quality and to create a template that we can use for more candidates. We have all our data in a database, and we want to be able to populate the stats from the database. Please reach out if you have expertise in this area and can help.\n\n(I will post an example soon.)",
      topics: ['Video'],
      creatorName: 'Cameron Sadeghi',
      creatorPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '2rgwWB2c1NwJe5sUe0P1nc',
          type: 'Asset',
          createdAt: '2020-06-12T01:54:10.425Z',
          updatedAt: '2020-06-12T01:54:10.425Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'Cameron Sadeghi',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/2rgwWB2c1NwJe5sUe0P1nc/655e72157543f115ed324fa17e6876d3/user-09.jpg',
            details: { size: 57218, image: { width: 512, height: 512 } },
            fileName: 'user-09.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
      email: 'cameron@thegoodparty.org',
      ichLink:
        'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=pp_url&entry.1354955634=Candidate+Video+Introductions',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '7pOEbwdpcxQDAAiTTIrYGW',
      type: 'Entry',
      createdAt: '2020-06-10T21:34:51.539Z',
      updatedAt: '2020-06-23T15:18:16.173Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 8,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'creatorsProject' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Explainer video for The Good Party',
      summary:
        'This is similar to the onboarding video I am working on. In addition to a short video inside the app, we need a more extended version that goes into more detail. A punchy explainer video that describes what The Good Party is and what we are trying to accomplish.\n\nI am looking for a copywriter and video editor as collaborators. Hit me up if you want to join the effort.',
      topics: ['Video', 'Social Media', 'Infographic'],
      creatorName: 'Farhad Mohit',
      creatorPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '6gti1rk7BZjNhQlRUEmh8Z',
          type: 'Asset',
          createdAt: '2020-06-10T21:34:43.529Z',
          updatedAt: '2020-06-10T21:34:43.529Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'user-07',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/6gti1rk7BZjNhQlRUEmh8Z/f05b4e80e9c2caf160131f2cc2dba3f3/user-07.jpg',
            details: { size: 47122, image: { width: 512, height: 512 } },
            fileName: 'user-07.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
      email: 'farhad@thegoodparty.org',
      ichLink:
        'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=pp_url&entry.1354955634=Explainer+video+for+The+Good+Party',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5YDcQC4PixxR1LJI5I9Jyx',
      type: 'Entry',
      createdAt: '2020-06-10T20:44:09.848Z',
      updatedAt: '2020-06-23T15:18:02.883Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 10,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'creatorsProject' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Onboarding video for The Good Party',
      summary:
        'I am working on a video to get new people familiar with The Good Party when they enter the app.\n\nI envision the video to be short, concise, and entertaining. It should make sense if people want to watch as a rolling story or be able to advance and rewind each segment to understand each concept.\n\nI am looking for a copywriter and video editor for this project. I will link to a more detailed brief soon. Until then, please reach out if you have expertise in this area and would like to collaborate on it. 🙏',
      creatorName: 'Farhad Mohit',
      creatorPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '2fI018EGMIKCQg2WcfboNN',
          type: 'Asset',
          createdAt: '2020-06-10T20:43:58.267Z',
          updatedAt: '2020-06-10T20:43:58.267Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'Farhad Mohit',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/2fI018EGMIKCQg2WcfboNN/b431630bc1e85629ad7e54c03893f676/user-07.jpg',
            details: { size: 47122, image: { width: 512, height: 512 } },
            fileName: 'user-07.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
      email: 'farhad@thegoodparty.org',
      ichLink:
        'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=pp_url&entry.1354955634=Onboarding+video+for+The+Good+Party',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '69roPOqyUqa7Zzx8k9tVG7',
      type: 'Entry',
      createdAt: '2020-06-12T01:43:01.676Z',
      updatedAt: '2020-06-23T15:17:50.019Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 6,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'creatorsProject' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Illustration or video explaining Voting Blocs',
      summary:
        'Voting blocs are the secret power of The Good Party. We need to do a better job explaining how they work.\n\nI am thinking of a set of illustrations or animations. I will link to a document shortly with ideas for a script and storyboard.\n\nI am looking for illustrators, copywriters, and animators to help me with this project. Please reach out if you can help.',
      topics: ['Video', 'Illustration', 'Animation'],
      creatorName: 'Dan Shipley',
      creatorPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '1gAyNcAJEnQuYQrCFBfOrq',
          type: 'Asset',
          createdAt: '2020-06-12T01:42:54.531Z',
          updatedAt: '2020-06-12T01:42:54.531Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'Dan Shipley',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/1gAyNcAJEnQuYQrCFBfOrq/1a97b5917c579f1de7356ef2c4c44a6b/user-10.jpg',
            details: { size: 37944, image: { width: 512, height: 512 } },
            fileName: 'user-10.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
      email: 'dan@thegoodparty.org',
      ichLink:
        'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=pp_url&entry.1354955634=Illustration+or+video+explaining+Voting+Blocs',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5urvywkiSlHsLGJbpqHGQn',
      type: 'Entry',
      createdAt: '2020-06-10T21:30:05.013Z',
      updatedAt: '2020-06-23T15:17:22.935Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 13,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'creatorsProject' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Formatting help for our deck: A Plan to Fix Politics, for Good!',
      summary:
        'Here is a copy of our pitch deck. I use this for webinars and video calls to share the vision of The Good Party. As we get more volunteers on board, it would be super helpful to have this deck in different formats.\n\nWe can also have different formats (Keynote, PowerPoint, Google Docs) and maybe even different styles that Good Party activists and volunteers can use to educate their networks.\n\nGo ahead and make a copy to create different versions. Reach out to me to coordinate the effort. I appreciate all the help.',
      topics: ['Presentation', 'Education'],
      links: [
        'https://docs.google.com/presentation/d/133fHS4CY9S8F1ZCilN5gSGtDjOSw42_AG2YaE7g1kpA/edit?usp=sharing',
        'https://www.figma.com/file/zTsfEWBLQD6qFGWw5os3k3/The-Good-Party-Logo?node-id=0%3A1',
      ],
      images: [
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '4GZb5NRV5q1gQG5sqY4h7w',
            type: 'Asset',
            createdAt: '2020-06-10T21:27:49.077Z',
            updatedAt: '2020-06-10T21:27:49.077Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'Power & Money have corrupted both major U.S. Parties ',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/4GZb5NRV5q1gQG5sqY4h7w/9bd577e799e0e24ee07fed861013cf78/The_Good_Party_-_Intro_01.png',
              details: { size: 74194, image: { width: 1010, height: 590 } },
              fileName: 'The Good Party - Intro 01.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '5wELIhpbFcu3rQdMQXIN1o',
            type: 'Asset',
            createdAt: '2020-06-10T21:29:08.519Z',
            updatedAt: '2020-06-10T21:29:08.519Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'A framework for optimism',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/5wELIhpbFcu3rQdMQXIN1o/e8ce4e8b0fd735d2152025d15003c7e2/The_Good_Party_-_Intro_02.png',
              details: { size: 95522, image: { width: 1010, height: 590 } },
              fileName: 'The Good Party - Intro 02.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '2Tsek58zx1Pb2OSPw3vnvc',
            type: 'Asset',
            createdAt: '2020-06-10T21:28:34.433Z',
            updatedAt: '2020-06-10T21:28:34.433Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'Elections are still stuck in the dark ages',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/2Tsek58zx1Pb2OSPw3vnvc/10694e077b97df6b7dece54cfeeddda1/The_Good_Party_-_Intro_03.png',
              details: { size: 481778, image: { width: 1010, height: 590 } },
              fileName: 'The Good Party - Intro 03.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '53RTfik7NK6iOQZaCu5xCr',
            type: 'Asset',
            createdAt: '2020-06-10T21:29:48.947Z',
            updatedAt: '2020-06-10T21:29:48.947Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'Founding Creators',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/53RTfik7NK6iOQZaCu5xCr/d6f2504b61a6b19923e23882b7857a41/The_Good_Party_-_Intro_04.png',
              details: { size: 176602, image: { width: 1010, height: 590 } },
              fileName: 'The Good Party - Intro 04.png',
              contentType: 'image/png',
            },
          },
        },
      ],
      creatorName: 'Farhad Mohit',
      creatorPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '2umV0RgHPFF0cKRh5KmYOG',
          type: 'Asset',
          createdAt: '2020-06-10T21:23:35.291Z',
          updatedAt: '2020-06-10T21:23:35.291Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'user-07',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/2umV0RgHPFF0cKRh5KmYOG/80190351e3baf47b7017e9a81d828b6f/user-07.jpg',
            details: { size: 47122, image: { width: 512, height: 512 } },
            fileName: 'user-07.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
      email: 'farhad@thegoodparty.org',
      ichLink:
        'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=pp_url&entry.1354955634=Formatting+help+for+our+deck:+A+Plan+to+Fix+Politics,+for+Good!',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '7LJqpmEeCMgsbix5Mb5sIa',
      type: 'Entry',
      createdAt: '2020-05-22T14:57:13.857Z',
      updatedAt: '2020-06-23T15:17:10.507Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 13,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'creatorsProject' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Share Images for Facebook, Twitter, Instagram, etc.',
      summary:
        "I am working on share images for social media to explain The Good Party and to generate awareness. It's a fun small project.\n\nIt would be good to target different demographics (younger, older, professional) with different tones (serious, funny, etc.)\n\nI am looking for different styles and ideas. Duplicate the Figma file to get started. Reach out to me to add your creations to the shared filed. 🙏",
      topics: ['Mobile', 'Social', 'Tik Tok', 'Twitter'],
      links: [
        'https://www.figma.com/file/HwPCVD5v8J228zvhoVYKMK/The-Good-Party-Open-Graph-Images?node-id=0%3A1',
        'https://www.figma.com/file/zTsfEWBLQD6qFGWw5os3k3/The-Good-Party-Logo?node-id=0%3A1',
      ],
      images: [
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '3sPWsGb949lxX1gZD9RpDs',
            type: 'Asset',
            createdAt: '2020-06-18T18:38:52.953Z',
            updatedAt: '2020-06-18T18:38:52.953Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'The Good Party',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/3sPWsGb949lxX1gZD9RpDs/cb5b7411fabc7e15ea6670cf07847099/10.png',
              details: { size: 19898, image: { width: 1200, height: 630 } },
              fileName: '10.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '6x4opeQV88qF07WLwfQCrk',
            type: 'Asset',
            createdAt: '2020-06-18T18:41:20.956Z',
            updatedAt: '2020-06-18T18:41:20.956Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title:
              'Red & Blue are just not Good enough. The Good Party has a better way.',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/6x4opeQV88qF07WLwfQCrk/faa6a09b92824a027bcdd308dedaf95f/20.png',
              details: { size: 34903, image: { width: 1200, height: 630 } },
              fileName: '20.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '1oWAOY1X3jmffwmtrzNBs9',
            type: 'Asset',
            createdAt: '2020-06-18T18:42:19.976Z',
            updatedAt: '2020-06-18T18:42:19.976Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title:
              'Power and money have corrupted both major political parties.',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/1oWAOY1X3jmffwmtrzNBs9/2fcd8ca9f083166552faa2502540fb02/30.png',
              details: { size: 44518, image: { width: 1200, height: 630 } },
              fileName: '30.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: 'ONMsDXqGDYBgs9HPzlfG5',
            type: 'Asset',
            createdAt: '2020-06-18T18:43:00.097Z',
            updatedAt: '2020-06-18T18:43:00.097Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'Big Money has corrupted our democracy.',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/ONMsDXqGDYBgs9HPzlfG5/aff59e85b4fc048a8e0b872c2841fd80/40.png',
              details: { size: 44994, image: { width: 1200, height: 630 } },
              fileName: '40.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '21eQa8uHpcOUTfF5HZeqET',
            type: 'Asset',
            createdAt: '2020-06-18T18:43:24.999Z',
            updatedAt: '2020-06-18T18:43:24.999Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'People. Planet. Peace.',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/21eQa8uHpcOUTfF5HZeqET/76224570257200c772a4db20ed7c2740/50.png',
              details: { size: 20694, image: { width: 1200, height: 630 } },
              fileName: '50.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '2DqNiGaCiLKSQJrAsBZqit',
            type: 'Asset',
            createdAt: '2020-06-18T18:46:06.285Z',
            updatedAt: '2020-06-18T18:46:06.285Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'Get money out of politics.',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/2DqNiGaCiLKSQJrAsBZqit/0e270a683f2b54219a58107420ec60cf/60.png',
              details: { size: 22183, image: { width: 1200, height: 630 } },
              fileName: '60.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: 'QNpc4AScJkn3N8SG32hrY',
            type: 'Asset',
            createdAt: '2020-06-18T18:46:56.750Z',
            updatedAt: '2020-06-18T18:46:56.750Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'Honestly Better Democracy.',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/QNpc4AScJkn3N8SG32hrY/62660e7269a2f0079860fe78b45688a0/70.png',
              details: { size: 21842, image: { width: 1200, height: 630 } },
              fileName: '70.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '5bTfKgyPlveAoyUOPfQJ0y',
            type: 'Asset',
            createdAt: '2020-06-18T18:47:33.783Z',
            updatedAt: '2020-06-18T18:47:33.783Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title:
              "Power and money have corrupted U.S. politics. Let's fix it!",
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/5bTfKgyPlveAoyUOPfQJ0y/c0e49f1dd6fb704653d5733b4cf04508/80.png',
              details: { size: 228312, image: { width: 1200, height: 630 } },
              fileName: '80.png',
              contentType: 'image/png',
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '5ecoYfkhVtI07jTDn6qqW8',
            type: 'Asset',
            createdAt: '2020-06-18T18:49:21.058Z',
            updatedAt: '2020-06-18T18:49:21.058Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'Enough of not good enough. Enough already.',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/5ecoYfkhVtI07jTDn6qqW8/961f22faaf9abe22193327d60a96d5cd/90.png',
              details: { size: 33763, image: { width: 1200, height: 630 } },
              fileName: '90.png',
              contentType: 'image/png',
            },
          },
        },
      ],
      creatorName: 'Kai Gradert',
      creatorPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '5wOBAruPVKBBlx0MkyjiXB',
          type: 'Asset',
          createdAt: '2020-06-08T21:16:55.386Z',
          updatedAt: '2020-06-08T21:16:55.386Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'Kai Gradert',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/5wOBAruPVKBBlx0MkyjiXB/c1acf11cb3daa53aa8c5f5fb431ad268/kai.jpg',
            details: { size: 524543, image: { width: 900, height: 900 } },
            fileName: 'kai.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
      email: 'kai.gradert@gmail.com',
      ichLink:
        'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=pp_url&entry.1354955634=Share+Images+for+Facebook,+Twitter,+Instagram,+etc.',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '6xY7IfpQWoXbuLurVDBgN6',
      type: 'Entry',
      createdAt: '2020-06-10T22:18:11.156Z',
      updatedAt: '2020-06-23T15:16:58.544Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 9,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'creatorsProject' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Sticker Variations',
      summary:
        'Our current stickers come in two variations: with a white background, and metallic holographic background that sparkle in the light.\n\nThe current stickers are cool, but it would nice to have more variations. Hit me up if you want to jam on some ideas. You can duplicate the Figma file to create more variations.\n\nShare your designs with us (info@thegoodparty.org), and we might print them. And if you want to grab some of the current stickers, fill out the form below.',
      topics: ['Stickers'],
      links: [
        'https://www.figma.com/file/Wl78AWt4wPGu3LBQkzfI4w/The-Good-Party-Stickers?node-id=0%3A1',
        'https://www.figma.com/file/zTsfEWBLQD6qFGWw5os3k3/The-Good-Party-Logo?node-id=0%3A1',
      ],
      images: [
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '66jCbjPSvL7HwjBunDn12Z',
            type: 'Asset',
            createdAt: '2020-06-10T22:20:34.591Z',
            updatedAt: '2020-06-11T22:29:10.211Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 2,
            locale: 'en-US',
          },
          fields: {
            title: 'Stickers',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/66jCbjPSvL7HwjBunDn12Z/845bef32ebdc377545070e1af1bb3a68/20200611-IMG_9863.jpg',
              details: { size: 1000371, image: { width: 1600, height: 900 } },
              fileName: '20200611-IMG_9863.jpg',
              contentType: 'image/jpeg',
            },
          },
        },
      ],
      creatorName: 'Kai Gradert',
      creatorPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '1lVsB8rxqyZszAvdw0aCKB',
          type: 'Asset',
          createdAt: '2020-06-10T22:18:02.597Z',
          updatedAt: '2020-06-10T22:18:02.597Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'Kai Gradert',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/1lVsB8rxqyZszAvdw0aCKB/6f11037858139b9df6aad56c5c25b261/user-06.jpg',
            details: { size: 45288, image: { width: 512, height: 512 } },
            fileName: 'user-06.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
      email: 'kai.gradert@gmail.com',
      ichLink:
        'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=pp_url&entry.1354955634=Sticker+Variations',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '28nZCXpEwm9ZGIbXHPEFOY',
      type: 'Entry',
      createdAt: '2020-06-11T22:37:59.260Z',
      updatedAt: '2020-06-23T15:16:47.761Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 10,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'creatorsProject' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Holographic Logo Effect',
      summary:
        'I am trying to create a holographic logo effect on handheld devices. The primary color of our logo is white. The idea is that as you tilt the phone, you will see all the rainbow colors. Similar to those metallic surfaces, you sometimes see on concert tickets.\n\nI am looking for somebody with iOS/Android experience create this effect. Hit the “I Can Help” button to reach out.',
      topics: ['Mobile', 'Logo', 'iOS', 'Android'],
      links: [
        'https://vimeo.com/428293520/b408dc6f35',
        'https://www.figma.com/file/zTsfEWBLQD6qFGWw5os3k3/The-Good-Party-Logo?node-id=0%3A1',
      ],
      video: 'https://vimeo.com/428293520/b408dc6f35',
      creatorName: 'Kai Gradert',
      creatorPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '40Ddm3OKKvMsGeSsA7fP9m',
          type: 'Asset',
          createdAt: '2020-06-11T22:37:44.978Z',
          updatedAt: '2020-06-11T22:37:44.978Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'Kai Gradert',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/40Ddm3OKKvMsGeSsA7fP9m/d929a034c0e0271fa2a5d5c7c59588c9/user-06.jpg',
            details: { size: 45288, image: { width: 512, height: 512 } },
            fileName: 'user-06.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
      email: 'kai.gradert@gmail.com',
      ichLink:
        'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=pp_url&entry.1354955634=Holographic+Logo+Effect',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '4pJFTbjN1ju65Ibfwr7oi9',
      type: 'Entry',
      createdAt: '2020-06-11T23:15:14.729Z',
      updatedAt: '2020-06-23T15:16:09.640Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 6,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'creatorsProject' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party Logo Files',
      summary:
        'Here is a copy of The Good Party logo. You can use this for any of your projects. I will expand this soon into a proper design system.',
      links: [
        'https://www.figma.com/file/zTsfEWBLQD6qFGWw5os3k3/The-Good-Party-Logo?node-id=0%3A1',
      ],
      images: [
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '7McZ5qw5p9NHx5tF9UxGuz',
            type: 'Asset',
            createdAt: '2020-06-11T23:13:47.986Z',
            updatedAt: '2020-06-11T23:13:47.986Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 1,
            locale: 'en-US',
          },
          fields: {
            title: 'The Good Party Logo',
            file: {
              url:
                '//images.ctfassets.net/g08ybc4r0f4b/7McZ5qw5p9NHx5tF9UxGuz/00ced70b08114810e486411b6e476bfc/Logo.jpg',
              details: { size: 69099, image: { width: 1200, height: 900 } },
              fileName: 'Logo.jpg',
              contentType: 'image/jpeg',
            },
          },
        },
      ],
      creatorName: 'Kai Gradert',
      creatorPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '3RkBPSCMiAmqMPIlTzdnbg',
          type: 'Asset',
          createdAt: '2020-06-11T23:14:49.578Z',
          updatedAt: '2020-06-11T23:14:49.578Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'Kai Gradert',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/3RkBPSCMiAmqMPIlTzdnbg/547b4b87afddf1c8f3521982d8f7d507/user-06.jpg',
            details: { size: 45288, image: { width: 512, height: 512 } },
            fileName: 'user-06.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
      email: 'kai.gradert@gmail.com',
      ichLink:
        'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=pp_url&entry.1354955634=The+Good+Party+Logo+Files',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '4qsS45bpfE6Yk6WA2gwQ6s',
      type: 'Entry',
      createdAt: '2020-06-18T03:11:32.158Z',
      updatedAt: '2020-06-20T00:59:34.770Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 5,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'faqOrder' },
      },
      locale: 'en-US',
    },
    fields: {
      faqArticle: [
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '48a7xazZc0eN4PXM20Jtel',
            type: 'Entry',
            createdAt: '2020-02-23T07:52:06.840Z',
            updatedAt: '2020-10-08T13:41:38.558Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 23,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'Is The Good Party a real political party?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'No. The Good Party is not an actual political party. We are a free non-commercial platform and set of open-source tools, being built by a ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'diverse, mostly volunteer team',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=33lnRLO7M0gvfqVkoVxADO' },
                    },
                    {
                      nodeType: 'text',
                      value: '. Our app allow voters to organize ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'crowd-voting campaigns',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' that gather organic momentum and allow good candidates with great ideas to get elected elected. ',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'Our mission is to make votes matter more than money, by providing the latest technology and tools that empower ordinary people to actively participate and have impact on democracy. ',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'Our first step is disrupting the existing two-party dominated political industrial complex by giving indie or grass-roots candidates a path to being elected - without having to depend on big money sources or toxic partisan politics. We do this by showcasing grass-roots candidates, and providing a crowd-voting platform that helps people spread the word and turn social media supporters into actual voters.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'We are organized as under I.R.C. Section 527 as a non-profit, tax exempt, political action committee, but ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'we run more like a technology start-up',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=33lnRLO7M0gvfqVkoVxADO' },
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' that has a public good interest, rather than a profit motive.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
            pages: ['party'],
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '33lnRLO7M0gvfqVkoVxADO',
            type: 'Entry',
            createdAt: '2020-01-21T02:06:30.974Z',
            updatedAt: '2020-10-08T13:16:43.894Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 29,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'Who is behind The Good Party?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'The Good Party is a non-profit, open-source project, run by a ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'passionate and diverse team',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=579kihjyIPloNaEw02rniq' },
                    },
                    {
                      nodeType: 'text',
                      value:
                        '. We believe that people are good and if empowered by technology, instead of enslaved by it, we can create a much better world for all. ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Our logo',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=U4dbmGezqNUIDdGriL5oA' },
                    },
                    {
                      nodeType: 'text',
                      value: ' hints at our motives!',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "We believe that commercial interests and power motives often undercut the vast potential of technology to help humanity. So, we've removed both money and power as motives and set ourselves up as a non-profit, open source project, where as many people as possible can be ",
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'pro bono',
                      marks: [{ type: 'italic' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: ' contributors and volunteers.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "This way, we can all just focus on building the best platform possible needed to take on humanity's biggest barrier to progress: the corruption of money and power in politics. The current system allows corrupt career politicians of either major party to hold onto power, election after election, setting the rules of society to benefit themselves and the big money sources that paid to get them elected.",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "Our mission is enormous and exciting: We're building a free, open, non-commercial foundational platform that upgrades the infrastructure of democracy everywhere. ",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "We're trying to make possible a kind of civic tour of duty, where good, ordinary, capable people can step up and serve as honest representatives. Where people can be given a chance to truly serve society and move everyone towards a more just and sustainable future. There are several steps to get there, but it starts with this simple Good Party app we offer you today.",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "The Good Party's main financial backing to date has come from one of our project co-founders, ",
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        { nodeType: 'text', value: '', marks: [], data: {} },
                      ],
                      data: { uri: 'https://farhadmohit.com' },
                    },
                    {
                      nodeType: 'text',
                      value:
                        'who is also a full-time volunteer here. We are committed to being open and transparent in all matters. You can see our disclosures here at ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'The Good Party Financial Summary',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: {
                        uri: 'https://www.fec.gov/data/committee/C00707398/',
                      },
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' on the Federal Election Commission (FEC) website.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'The Good Party seeks as many diversely talented creative people as possible to help us build something truly good!  ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Interested? Ping us!',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          "mailto:ask@thegoodparty.org?subject=I'm interested!&body=[Include Bio and area of interest]",
                      },
                    },
                    { nodeType: 'text', value: '', marks: [], data: {} },
                  ],
                  data: {},
                },
              ],
            },
            pages: ['party'],
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '579kihjyIPloNaEw02rniq',
            type: 'Entry',
            createdAt: '2020-04-17T23:02:00.645Z',
            updatedAt: '2020-10-07T22:31:47.714Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 15,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'Our team',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'heading-3',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'The Good Party Crew',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Tomer Almog',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          'https://www.linkedin.com/in/tomer-almog-742b6b40/',
                      },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Engineering',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Peter Asaro',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          'https://www.linkedin.com/in/peter-asaro-a0a725191/',
                      },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Engineering',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Kai Gradert',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://www.linkedin.com/in/kaigradert/' },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Product / Design',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    { nodeType: 'text', value: '', marks: [], data: {} },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Nick Greene',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://www.linkedin.com/in/njdgx/' },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Product',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Farhad Mohit',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://www.linkedin.com/in/farhad667/' },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Product',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Cameron Sadeghi',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          'https://www.linkedin.com/in/cameron-sadeghi-9662081b/',
                      },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Politics Associate',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    { nodeType: 'text', value: '', marks: [], data: {} },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Dan Shipley',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: {
                        uri: 'https://www.linkedin.com/in/danielshipley/',
                      },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Design / User Experience',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Zak Tomich',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://www.linkedin.com/in/zaktomich/' },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Political Strategy / Operations',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'heading-4',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Good Party Volunteers',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Jared Alper',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          'https://www.linkedin.com/in/jared-alper-00606093/',
                      },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Political Data',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Navid Aslani',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://www.linkedin.com/in/navidaslani/' },
                    },
                    {
                      nodeType: 'text',
                      value: ' ',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: '- HR / Operations',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Kam Kafi',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://www.linkedin.com/in/kamkafi/' },
                    },
                    {
                      nodeType: 'text',
                      value: ' - Creator Relations',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: "Brian O'Neil",
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          'https://www.linkedin.com/in/brian-o-neil-a8b5283/',
                      },
                    },
                    {
                      nodeType: 'text',
                      value: ' - HR / FEC / Finance',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    { nodeType: 'text', value: '', marks: [], data: {} },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Jean Rousseau',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: {
                        uri: 'https://www.linkedin.com/in/jeanrousseau/',
                      },
                    },
                    {
                      nodeType: 'text',
                      value: ' ',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: '- Field Operations',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Interested in joining us? \n💪 ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: ' ',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Get in touch! ',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          'https://docs.google.com/forms/d/e/1FAIpQLSfPPTHykqtlSq2tRRu49XemAdI54i260jGEZ_ghaCexqM4I4Q/viewform?usp=sf_link',
                      },
                    },
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: 'U4dbmGezqNUIDdGriL5oA',
            type: 'Entry',
            createdAt: '2020-06-02T00:20:42.164Z',
            updatedAt: '2020-07-19T15:08:42.370Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 21,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'Meaning of our Logo',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'heading-2',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Red, Bright and Blue!',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "We are tired of the divisiveness and negativity of both sides of the political establishment. We wanted our logo to immediately convey that we're something positive, different and good. We also want it to feel super-heroic, but at the same time approachable, humble and inviting. We want our logo to actively welcome everyone to join and take part!",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'heading-3',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Our shapes: Heart and Star',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'unordered-list',
                  content: [
                    {
                      nodeType: 'list-item',
                      content: [
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value: 'Heart as in Human ❤️',
                              marks: [{ type: 'bold' }],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                        {
                          nodeType: 'unordered-list',
                          content: [
                            {
                              nodeType: 'list-item',
                              content: [
                                {
                                  nodeType: 'paragraph',
                                  content: [
                                    {
                                      nodeType: 'text',
                                      value: 'As in love ',
                                      marks: [],
                                      data: {},
                                    },
                                  ],
                                  data: {},
                                },
                              ],
                              data: {},
                            },
                            {
                              nodeType: 'list-item',
                              content: [
                                {
                                  nodeType: 'paragraph',
                                  content: [
                                    {
                                      nodeType: 'text',
                                      value: 'As in life',
                                      marks: [],
                                      data: {},
                                    },
                                  ],
                                  data: {},
                                },
                              ],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                      ],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'unordered-list',
                  content: [
                    {
                      nodeType: 'list-item',
                      content: [
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value: 'Star as in Freedom ☆ ',
                              marks: [{ type: 'bold' }],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                        {
                          nodeType: 'unordered-list',
                          content: [
                            {
                              nodeType: 'list-item',
                              content: [
                                {
                                  nodeType: 'paragraph',
                                  content: [
                                    {
                                      nodeType: 'text',
                                      value: 'As in liberty ',
                                      marks: [],
                                      data: {},
                                    },
                                  ],
                                  data: {},
                                },
                              ],
                              data: {},
                            },
                            {
                              nodeType: 'list-item',
                              content: [
                                {
                                  nodeType: 'paragraph',
                                  content: [
                                    {
                                      nodeType: 'text',
                                      value: 'As in justice',
                                      marks: [],
                                      data: {},
                                    },
                                  ],
                                  data: {},
                                },
                              ],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                      ],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'heading-3',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Our colors: Bright and White',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'unordered-list',
                  content: [
                    {
                      nodeType: 'list-item',
                      content: [
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value: 'Bright as in Light 🌈',
                              marks: [{ type: 'bold' }],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                        {
                          nodeType: 'unordered-list',
                          content: [
                            {
                              nodeType: 'list-item',
                              content: [
                                {
                                  nodeType: 'paragraph',
                                  content: [
                                    {
                                      nodeType: 'text',
                                      value:
                                        'The full spectrum of diverse colors',
                                      marks: [],
                                      data: {},
                                    },
                                  ],
                                  data: {},
                                },
                              ],
                              data: {},
                            },
                            {
                              nodeType: 'list-item',
                              content: [
                                {
                                  nodeType: 'paragraph',
                                  content: [
                                    {
                                      nodeType: 'text',
                                      value:
                                        'All coming together and shining, as one',
                                      marks: [],
                                      data: {},
                                    },
                                  ],
                                  data: {},
                                },
                              ],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value: '',
                              marks: [],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                      ],
                      data: {},
                    },
                    {
                      nodeType: 'list-item',
                      content: [
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value: 'White as in Peace 🕊',
                              marks: [{ type: 'bold' }],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                        {
                          nodeType: 'unordered-list',
                          content: [
                            {
                              nodeType: 'list-item',
                              content: [
                                {
                                  nodeType: 'paragraph',
                                  content: [
                                    {
                                      nodeType: 'text',
                                      value: 'The 3rd color on our flag',
                                      marks: [],
                                      data: {},
                                    },
                                  ],
                                  data: {},
                                },
                              ],
                              data: {},
                            },
                            {
                              nodeType: 'list-item',
                              content: [
                                {
                                  nodeType: 'paragraph',
                                  content: [
                                    {
                                      nodeType: 'text',
                                      value:
                                        'The clear alternative to red + blue',
                                      marks: [],
                                      data: {},
                                    },
                                  ],
                                  data: {},
                                },
                              ],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                      ],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "Based on this we have two kinds of stickers, that we'll start distributing soon:",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'embedded-asset-block',
                  content: [],
                  data: {
                    target: {
                      sys: {
                        space: {
                          sys: {
                            type: 'Link',
                            linkType: 'Space',
                            id: 'g08ybc4r0f4b',
                          },
                        },
                        id: '5ltogLmmGOq0CkJCCvqHpt',
                        type: 'Asset',
                        createdAt: '2020-06-02T00:21:40.365Z',
                        updatedAt: '2020-06-02T00:42:44.296Z',
                        environment: {
                          sys: {
                            id: 'master',
                            type: 'Link',
                            linkType: 'Environment',
                          },
                        },
                        revision: 2,
                        locale: 'en-US',
                      },
                      fields: {
                        title: 'FAQ - Logos',
                        file: {
                          url:
                            '//images.ctfassets.net/g08ybc4r0f4b/5ltogLmmGOq0CkJCCvqHpt/6651d14467ed29ad01852d0b21c2e5ef/For_FAQ.png',
                          details: {
                            size: 106715,
                            image: { width: 727, height: 316 },
                          },
                          fileName: 'For FAQ.png',
                          contentType: 'image/png',
                        },
                      },
                    },
                  },
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    { nodeType: 'text', value: '', marks: [], data: {} },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Which do you like better?',
                          marks: [{ type: 'bold' }, { type: 'underline' }],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://forms.gle/TGLLL5gqaZadFMCN8' },
                    },
                    { nodeType: 'text', value: '', marks: [], data: {} },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    { nodeType: 'text', value: '', marks: [], data: {} },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '1ic6T6fhH0jZLNvX5aZkDe',
            type: 'Entry',
            createdAt: '2020-05-01T07:03:46.910Z',
            updatedAt: '2021-01-08T22:10:57.392Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 35,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'What is a crowd-voting campaign?',
            articleBody: {
              data: {},
              content: [
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        'A crowd-voting campaign is a way to make votes matter more than money.  ',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        "Crowd-voting empowers people to rally around all candidates they like to see if it's possible to get them elected by spreading the word and enlisting others to pledge their votes, rather than just asking people to donate money and then cast their votes in isolation.",
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        'Each crowd-voting campaign brings much needed transparency to an election by showing ',
                      nodeType: 'text',
                    },
                    {
                      data: { uri: '?article=4qI5UjYbJmivzBOy1y74Z4' },
                      content: [
                        {
                          data: {},
                          marks: [],
                          value: 'how many votes are needed to win',
                          nodeType: 'text',
                        },
                      ],
                      nodeType: 'hyperlink',
                    },
                    {
                      data: {},
                      marks: [],
                      value:
                        ', and how many other likely voters there are for a candidate.  ',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value: 'In this way, ',
                      nodeType: 'text',
                    },
                    {
                      data: { uri: '?article=prGq4SAFpfT7qzBFM1HDy' },
                      content: [
                        {
                          data: {},
                          marks: [],
                          value:
                            'nobody ever has to worry about wasting their vote',
                          nodeType: 'text',
                        },
                      ],
                      nodeType: 'hyperlink',
                    },
                    {
                      data: {},
                      marks: [],
                      value:
                        ', because everyone knows if a candidate they like can can win ',
                      nodeType: 'text',
                    },
                    {
                      data: {},
                      marks: [{ type: 'italic' }, { type: 'bold' }],
                      value: 'before anyone goes out and actually votes!',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        "So, for the first time ever, people can join crowd-voting campaigns for ALL candidates they like and truly explore all their  options -- not just pick the 'lesser of two evil' candidates approved by red or blue.  ",
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        "It's important to note that there is no cost or downside to joining a crowd-voting campaign using The Good Party.  Every crowd-voting campaign on The Good Party is absolutely free for both people and candidates.",
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
              ],
              nodeType: 'document',
            },
            pages: ['election', 'district'],
            category: [
              {
                sys: {
                  space: {
                    sys: {
                      type: 'Link',
                      linkType: 'Space',
                      id: 'g08ybc4r0f4b',
                    },
                  },
                  id: '4CrRDuyTqip7XK7DdK4tq7',
                  type: 'Entry',
                  createdAt: '2021-01-08T22:10:16.397Z',
                  updatedAt: '2021-01-09T22:04:47.429Z',
                  environment: {
                    sys: {
                      id: 'master',
                      type: 'Link',
                      linkType: 'Environment',
                    },
                  },
                  revision: 2,
                  contentType: {
                    sys: {
                      type: 'Link',
                      linkType: 'ContentType',
                      id: 'articleCategory',
                    },
                  },
                  locale: 'en-US',
                },
                fields: { name: 'How The Good Party Works', order: 1 },
              },
            ],
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '4qI5UjYbJmivzBOy1y74Z4',
            type: 'Entry',
            createdAt: '2020-03-19T23:34:28.101Z',
            updatedAt: '2020-07-19T15:18:03.383Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 16,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'How do you know the number of votes needed to win?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'We use election data and a predictive model to estimate how many votes are needed to guarantee a win for each Federal election across America. We are conservative with our estimates to ensure that we never end up with a false-positive. So we can confidently say we will never waste a single vote.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'heading-3',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Our Data & Model:',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Thanks to ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: "MIT's Election Lab",
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://electionlab.mit.edu/data' },
                    },
                    {
                      nodeType: 'text',
                      value:
                        ', we have access to comprehensive voting data from all Federal elections since 1976. We have used this data to create a model that helps us predict just how many votes we need to win any race in 2020.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'Admittedly, our model is relatively simplistic today. For instance, due to the ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Electoral College rules',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          'https://en.wikipedia.org/wiki/United_States_Electoral_College',
                      },
                    },
                    {
                      nodeType: 'text',
                      value:
                        ', winning the Presidential election requires more than just getting enough of the popular vote. So, our current model is not adequate much beyond just getting us started... and it will continue to improve and get better over time.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Good spot to help if you can: ',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value:
                        'If you are a politically-minded data scientist who would be excited to join an open-source effort to try and fix politics for Good, please ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'get in touch',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          'mailto:info@thegoodparty.org?subject=Data%20Model%20Team',
                      },
                    },
                    { nodeType: 'text', value: '!', marks: [], data: {} },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '4etzzkBH9v6pD8Hl7KpLeL',
            type: 'Entry',
            createdAt: '2020-02-24T05:07:09.522Z',
            updatedAt: '2020-07-19T14:44:51.794Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 11,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'Could the Good Party mess up the general election?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'No. We have designed The Good Party specifically ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'not',
                      marks: [{ type: 'italic' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' to do that. Rather, we let you know if there are enough votes to elect a Good indie or grass-roots candidate, ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'before',
                      marks: [{ type: 'bold' }, { type: 'italic' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' you actually go out and vote. So, the Good Party ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'never wastes your time or any votes',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=prGq4SAFpfT7qzBFM1HDy' },
                    },
                    { nodeType: 'text', value: '.', marks: [], data: {} },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'If we haven\'t counted enough votes, we simply let you know so you can vote for the "lesser of two evils" among the major party candidates, or just sit this election out, if you don\'t like anyone enough.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '4AupMs228xSHleBULCVdqa',
            type: 'Entry',
            createdAt: '2020-06-02T21:57:59.862Z',
            updatedAt: '2020-10-08T13:39:20.963Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 10,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title:
              'How do you ensure your crowd-voting campaigns can turn out actual voters?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'As people join crowd-voting campaigns, we help them get voterized and get ready to vote by:',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'ordered-list',
                  content: [
                    {
                      nodeType: 'list-item',
                      content: [
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value:
                                'Checking their voter registration status.',
                              marks: [],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                      ],
                      data: {},
                    },
                    {
                      nodeType: 'list-item',
                      content: [
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value: 'Registering to vote (as needed).',
                              marks: [],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                      ],
                      data: {},
                    },
                    {
                      nodeType: 'list-item',
                      content: [
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value:
                                'Request their vote by mail ballots, or find their nearest polling locations.',
                              marks: [],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                      ],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'As we do that, all others in the crowd-voting campaign can see the progress and get excited about the possibility of winning.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'Once we have enough likely voters that we can guaranteed a win, we start the process of getting out the vote, and having campaign members share peer-to-peer their "I voted for Good" online stickers, reaching out to their friends to do the same.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "The reason you don't see all those additional steps up front, is two-fold:",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'ordered-list',
                  content: [
                    {
                      nodeType: 'list-item',
                      content: [
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value:
                                'Today, everyone (regardless of voter registration status) should be able to join a crowd-voting campaign and support a candidate, by spreading the word and helping the campaign grow virally.',
                              marks: [],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                      ],
                      data: {},
                    },
                    {
                      nodeType: 'list-item',
                      content: [
                        {
                          nodeType: 'paragraph',
                          content: [
                            {
                              nodeType: 'text',
                              value:
                                'We have limited resources and focused on deploying the core functionality first. Now we are working feverishly to build the get out the vote components before election day.',
                              marks: [],
                              data: {},
                            },
                          ],
                          data: {},
                        },
                      ],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'If this excites you and you can help, ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'please consider volunteering with us',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          "mailto:ask@thegoodparty.org?subject=I'm interested!&body=[Include Bio and area of interest]",
                      },
                    },
                    {
                      nodeType: 'text',
                      value: ', and help fix politics for Good! 🙏',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    { nodeType: 'text', value: '', marks: [], data: {} },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: 'prGq4SAFpfT7qzBFM1HDy',
            type: 'Entry',
            createdAt: '2020-05-01T03:03:31.379Z',
            updatedAt: '2020-10-08T13:37:38.909Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 20,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'We never waste your vote!',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'The Good Party allows people to join ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'crowd-voting campaigns',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
                    },
                    { nodeType: 'text', value: ' ', marks: [], data: {} },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        { nodeType: 'text', value: '', marks: [], data: {} },
                      ],
                      data: {
                        uri:
                          'https://thegoodparty.org/party/faq/what-is-a-candidate-votingbloc/1ic6T6fhH0jZLNvX5aZkDe',
                      },
                    },
                    {
                      nodeType: 'text',
                      value:
                        "and to track each campaign's growth to see if any candidate they like has a chance to win. This means that for the first time in history, people can actually see how many people are willing to vote together with them for a candidate they like, ",
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'before',
                      marks: [{ type: 'bold' }, { type: 'italic' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: ' anyone actually votes!',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'The idea is to never waste a vote! The Good Party only activates and coordinates a group vote if we have enough votes to guarantee victory in advance.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'Otherwise, we just notify everyone that the crowd-voting campaign came up short, and let everyone vote for the lesser of two evils between other candidates.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '30epU8vSgh9SeSnfGJmsDc',
            type: 'Entry',
            createdAt: '2020-06-02T14:27:13.966Z',
            updatedAt: '2020-10-08T13:31:39.268Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 4,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title:
              'Do you have crowd-voting campaigns for primary and local elections?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'Not yet. We are a small team and have decided to focus on just the Federal level, General Elections, where we can prove the voting blocs concept and have most impact.   ',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "So for this election we're focused on the U.S President, U.S. Senate, and U.S. House of Representatives races. That still represents over 470 races, and thousands of candidates.",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'That said, our mission is to build an open-source, free, decentralized and non-commercial democracy that can be used by people across the whole world.  ',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: "The Good Party's ",
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'crowd-voting platform',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
                    },
                    {
                      nodeType: 'text',
                      value:
                        " is a fundamental feature that's designed to be applicable to all democratic elections. And, we have a ton of features and enhancements in the works.   ",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'So, yes, we plan to have U.S. state and local elections, plus all their associated primaries are on our roadmap down the line.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "We're hopeful that as this good idea spreads, volunteer developers from all over will join us and help us build out The Good Party to what it must be: a freely available, decentralized, non-commercial public good that helps upgrade democracy for all.",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '7Mrfo6spgrgpwAFe83Oph4',
            type: 'Entry',
            createdAt: '2020-01-21T02:10:36.100Z',
            updatedAt: '2020-07-19T15:50:50.928Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 6,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title:
              'Does joining The Good Party app impact my ability to vote in primaries or for other candidates?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'No. Your party affiliation and vote are always yours and you always have the choice to vote for whomever you like in the primaries or General Election. The Good Party app just allows you to see your options ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'before ',
                      marks: [{ type: 'italic' }, { type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'you vote.  ',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'This way you can see whether your vote can be combined with others to enable you to elect a Good grass-roots or indie candidate you might like more than the establishment candidates who are offered.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '2zn1lYvlEB3sHYwUTeLqyS',
            type: 'Entry',
            createdAt: '2019-12-10T09:54:44.475Z',
            updatedAt: '2020-07-19T15:12:02.609Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 11,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title:
              'If I’m registered as a Democrat or Republican, does joining the Good Party app change anything?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "No. Your party affiliations are not affected in any way. The Good Party is not an official political party. We're a technology platform that shows you voting blocs of the Potentially Good grassroots and indie candidates are in your area, so you can quickly check whether they have enough votes to get elected. ",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'We are only a "good party" in that we offer people a good alternative to the "lesser of two evils," and career politicians offered by the two major parties.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '5KnBx42FOEVDJNUFpoU1PX',
            type: 'Entry',
            createdAt: '2020-05-19T22:03:26.257Z',
            updatedAt: '2020-07-19T14:39:25.144Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 30,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'What makes a candidate "Potentially Good?"',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'To be a ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'Potentially Good ',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'option, a candidate must pass ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'both',
                      marks: [{ type: 'underline' }],
                      data: {},
                    },
                    { nodeType: 'text', value: ' our ', marks: [], data: {} },
                    {
                      nodeType: 'text',
                      value: 'Follow the Money',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    { nodeType: 'text', value: ' and ', marks: [], data: {} },
                    {
                      nodeType: 'text',
                      value: 'Character Check',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: ' criteria below:',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'heading-3',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Follow the Money',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Mostly Funded by Small Donors (<$200).',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' Major candidates who have raised lots of funding, but have ensured that most of their funding (>50%) is coming from Small Individual Donors (<$200).',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    { nodeType: 'text', value: 'or ', marks: [], data: {} },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Relatively Small Amount of Funding.',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' Candidates who have raised relatively little funding when compared to the incumbent in race. These are candidates who have raised less than half (<50%) of the funding of the incumbent and are relying on grass-roots campaigning, word-of-mouth and their policy positions to get them elected.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'heading-3',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Character Check',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'Candidate passes our minimum standard of civility, meaning they have been vetted to ensure that they are ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'not',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: ' engaged in a pattern of activities or ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'hate-speech',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=5bwvf0PwsbpFEe8IJ9sHhX' },
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' that encourages intolerance, discrimination, hostility or hatred towards a person or group based on constitutionally or state-law protected classes, such as race, religion, color, creed, sexual orientation, age, disability or gender.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
            pages: ['district', 'election'],
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '66i4vRRLkX1yf8MnCQvYSb',
            type: 'Entry',
            createdAt: '2020-05-29T22:49:24.191Z',
            updatedAt: '2020-07-18T03:40:34.003Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 5,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: "What is The Good Party's minimum standard of civility?",
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'We vet all candidates to ensure that they have ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'not',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: ' engaged in a pattern of activities or ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'hate-speech',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=5bwvf0PwsbpFEe8IJ9sHhX' },
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' encouraging intolerance, discrimination or hostility towards a constitutionally or state-protected group or class.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '5bwvf0PwsbpFEe8IJ9sHhX',
            type: 'Entry',
            createdAt: '2020-05-23T18:17:31.158Z',
            updatedAt: '2020-07-19T15:51:57.278Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 2,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'What is hate-speech?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'The Good Party goes with the ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'U.N. definition of hate-speech',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: {
                        uri:
                          'https://www.un.org/en/genocideprevention/documents/UN%20Strategy%20and%20Plan%20of%20Action%20on%20Hate%20Speech%2018%20June%20SYNOPSIS.pdf',
                      },
                    },
                    {
                      nodeType: 'text',
                      value:
                        ' as any kind of communication in speech, writing or behavior, that attacks or uses pejorative or discriminatory language with reference to a person or a group on the basis of who they are. In other words, based on their religion, ethnicity, nationality, race, color, descent, gender or other identity factor.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'We look for a pattern of behavior and also make sure that we include hate-speech against any ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value:
                            'constitutionally and state-protected groups and classes',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: {
                        uri: 'https://en.wikipedia.org/wiki/Protected_group',
                      },
                    },
                    {
                      nodeType: 'text',
                      value: ' in the United States.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '3yMjX3IPC2yIF3fj5rtbrq',
            type: 'Entry',
            createdAt: '2020-02-23T07:54:13.780Z',
            updatedAt: '2020-10-08T13:29:14.080Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 12,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'What is the Write-in Vote?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'The Write-in Vote is a rarely used feature of the election system in the United States, which has been with us since the founding of the country. Just as it sounds, the write-in vote allows people to literally ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'write-in',
                      marks: [{ type: 'italic' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value:
                        " the name of a preferred candidate if they don't like the names who are on the ballot.",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "The reason this feature is infrequently used is that it is very hard to coordinate enough people to write-in the same name and actually get someone elected, and many voters fear it's a wasted vote. However, the power of the write-in vote is that in elections where the two-party system has effectively locked out good grass-roots or indie candidates, we can still write-in any legit candidate's name and get them elected.",
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "Now, for the first time in history, by using The Good Party's app and joining ",
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'crowd-voting campaigns',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
                    },
                    {
                      nodeType: 'text',
                      value:
                        ', we will finally be able to coordinate an effective write-in vote, and be sure that, ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'before anyone fills out their ballot, ',
                      marks: [{ type: 'bold' }, { type: 'italic' }],
                      data: {},
                    },
                    {
                      nodeType: 'text',
                      value: 'we have enough votes to guarantee a win.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '5rNQ7AbDebbvsm0078gPXg',
            type: 'Entry',
            createdAt: '2020-03-26T08:54:46.617Z',
            updatedAt: '2020-10-13T01:00:38.476Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 29,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'Why is Bernie Sanders listed as a Write-in Candidate?',
            articleBody: {
              data: {},
              content: [
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        'Bernie Sanders is listed "As a Write-in," because regardless of what the two major parties would have you believe, the election does not only happen during their primaries! ',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        "Under the current system, the choices on the November ballot are basically decided by the two major parties' power brokers who limit the number of real choices. This cuts third-party, independent and even promising red and blue candidates out of the process months before most voters even begin paying attention to the election. ",
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value: 'However, we are offering a ',
                      nodeType: 'text',
                    },
                    {
                      data: { uri: '?article=1ic6T6fhH0jZLNvX5aZkDe' },
                      content: [
                        {
                          data: {},
                          marks: [],
                          value: 'crowd-voting campaign',
                          nodeType: 'text',
                        },
                      ],
                      nodeType: 'hyperlink',
                    },
                    {
                      data: {},
                      marks: [],
                      value:
                        ' for Bernie Sanders to see if he can get enough likely votes to win the real election on November 3rd, 2020, ',
                      nodeType: 'text',
                    },
                    {
                      data: {},
                      marks: [{ type: 'bold' }, { type: 'italic' }],
                      value: 'before any actual votes are cast! ',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        'This way, without wasting a single vote, "we the people" get to see if Bernie is truly electable before we vote. And rest assured that we will only activate a voting bloc to vote, if we doubly confirm that we have all the votes we need to win the election.',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        'That said, if the Bernie crowd-voting campaign doesn\'t get enough votes to win, we stand down and let people know, so they can vote "the lessor of two evils" between red or blue mainstream candidates, or stay on the sidelines, if they choose.',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value:
                        "Growing any write-in presidential candidate's crowd-voting campaign enough to ensure a win would be totally unprecedented in modern times. However, good ideas do spread quickly online. ",
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
                {
                  data: {},
                  content: [
                    {
                      data: {},
                      marks: [],
                      value: 'So, why not try?  What have we got to lose?',
                      nodeType: 'text',
                    },
                  ],
                  nodeType: 'paragraph',
                },
              ],
              nodeType: 'document',
            },
            pages: ['election'],
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '4c0UMRSwDPu5gLSPPxGz4s',
            type: 'Entry',
            createdAt: '2020-01-21T02:13:17.965Z',
            updatedAt: '2020-07-19T14:57:01.164Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 15,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title:
              'Will I be asked to donate money to participate in The Good Party?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'No. The Good Party is free for both users and candidates. We view our service as a vital public good that must stay free, open and non-commercial.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        "If you're wondering how we pay the bills, through volunteer efforts and donations from ",
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'our core team',
                          marks: [],
                          data: {},
                        },
                      ],
                      data: { uri: '?article=579kihjyIPloNaEw02rniq' },
                    },
                    { nodeType: 'text', value: '.  ', marks: [], data: {} },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'At some point we may accept outside donations from those who want to help, but for now we have enough resources and volunteers joining to help us build what we need.',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value:
                        'If you want to help, please consider volunteering with us, or telling candidates and friends about The Good Party and help us get more people using the service!',
                      marks: [],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
          },
        },
        {
          sys: {
            space: {
              sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
            },
            id: '7D3TGoveRpv3RjgAWnefCy',
            type: 'Entry',
            createdAt: '2020-06-03T03:13:36.724Z',
            updatedAt: '2020-07-18T03:39:18.167Z',
            environment: {
              sys: { id: 'master', type: 'Link', linkType: 'Environment' },
            },
            revision: 18,
            contentType: {
              sys: { type: 'Link', linkType: 'ContentType', id: 'faqArticle' },
            },
            locale: 'en-US',
          },
          fields: {
            title: 'How can I learn more about The Good Party?',
            articleBody: {
              nodeType: 'document',
              data: {},
              content: [
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Join us for a ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'Livestream + Q&A or Watch a Replay',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://thegoodparty.org/party/events' },
                    },
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    { nodeType: 'text', value: 'or', marks: [], data: {} },
                  ],
                  data: {},
                },
                {
                  nodeType: 'paragraph',
                  content: [
                    {
                      nodeType: 'text',
                      value: 'Read our ',
                      marks: [],
                      data: {},
                    },
                    {
                      nodeType: 'hyperlink',
                      content: [
                        {
                          nodeType: 'text',
                          value: 'FAQ',
                          marks: [{ type: 'bold' }],
                          data: {},
                        },
                      ],
                      data: { uri: 'https://thegoodparty.org/party/faqs' },
                    },
                    {
                      nodeType: 'text',
                      value: '',
                      marks: [{ type: 'bold' }],
                      data: {},
                    },
                  ],
                  data: {},
                },
              ],
            },
            pages: ['district', 'election', 'party'],
          },
        },
      ],
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '21NWFkt7J5sIsnDZNE27UW',
      type: 'Entry',
      createdAt: '2020-06-18T01:18:04.223Z',
      updatedAt: '2020-06-18T01:18:04.223Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 1,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-06-17T17:00',
      displayDate: 'Wednesday, June 17th, 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-20200617',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '3v0K2DGDN9sIBhoILg1dgY',
      type: 'Entry',
      createdAt: '2019-12-03T05:22:08.510Z',
      updatedAt: '2020-06-11T01:52:15.045Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 8,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'event' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'The Good Party - Intro + Q&A - REPLAY',
      dateAndTime: '2020-06-03T17:00',
      displayDate: 'Wednesday, June 3rd, 2020 · 5:00pm PT (8:00pm ET)',
      timeZone: 'PST',
      description:
        'Watch replay of this crowdcast by clicking on the link below...',
      eventDuration: 1,
      presenter: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: 'uBa1kXny8v3NzSusxBzcj',
          type: 'Entry',
          createdAt: '2019-12-02T04:54:42.247Z',
          updatedAt: '2019-12-02T19:54:49.035Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
          },
          locale: 'en-US',
        },
        fields: {
          name: 'Farhad Mohit',
          title: 'Founder, The Good Party',
          avatarPhoto: {
            sys: {
              space: {
                sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
              },
              id: '7JFCpApSXrygLTODRTW6NQ',
              type: 'Asset',
              createdAt: '2019-12-02T04:53:00.374Z',
              updatedAt: '2020-03-21T07:12:07.569Z',
              environment: {
                sys: { id: 'master', type: 'Link', linkType: 'Environment' },
              },
              revision: 2,
              locale: 'en-US',
            },
            fields: {
              title: 'Farhad',
              file: {
                url:
                  '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
                details: { size: 47289, image: { width: 216, height: 216 } },
                fileName: '053_LK1_2704.jpg',
                contentType: 'image/jpeg',
              },
            },
          },
        },
      },
      location: 'https://www.crowdcast.io/e/the-good-party-1',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5Wx17h0KDwpLZRTR3wOYA3',
      type: 'Entry',
      createdAt: '2020-05-24T20:10:43.788Z',
      updatedAt: '2020-05-25T00:07:38.734Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'presidentialCandidate',
        },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Jo Jorgensen',
      website: 'https://joj2020.com/',
      facebook: 'https://www.facebook.com/JoJorgensen2020/',
      info: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Jo Jorgensen’s Bold, Practical, Libertarian Vision for America’s Future',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [{ type: 'italic' }],
                value:
                  'Generations of Republican and Democrat politicians have failed the people of America. Together they’ve given us:',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'Over $23 trillion in debt, trillion-dollar deficits, plus trillions more in unfunded liabilities',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'Non-Stop Involvement in expensive and deadly foreign war',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value: 'Skyrocketing health care costs',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'The highest imprisonment rate in the world; even higher among racial minorities and the poor',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'A broken retirement system unable to pay promised benefits',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'Tariffs that are destroying markets for American farmers',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value: 'An endless immigration crisis',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
            ],
            nodeType: 'unordered-list',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Big government mandates and programs created these problems. To solve them, we need to make government smaller – much, much smaller.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'Here is a brief overview of my bold, practical, Libertarian vision for America’s future:',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Government Spending, Deficits, and Debt:',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“As President, I will use my Constitutional authority to block any new borrowing. I will veto any spending bill that would lead to a deficit, and veto any debt ceiling increase.  I will give every Cabinet secretary a specific spending reduction target to meet and hold them accountable.  There is simply no excuse for sticking our children and grandchildren with the bill for these bipartisan bloated budgets.”',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Neutrality and Peace:',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: '“', nodeType: 'text' },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'Turn America into One Giant Switzerland: Armed and Neutral',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' – with the military force to defend America’s shores and soil against any foreign attackers or invaders. Protected by an armed citizenry and by a military laser-focused on defending America.  No US involvement in foreign wars. Bring home our 200,000+ American military personnel stationed in foreign countries. No US military aid to foreign governments. No US blockades or embargoes of non-military trade. Peace.” ',
                nodeType: 'text',
              },
              {
                data: { uri: 'https://joj2020.com/neutrailty-and-peace/' },
                content: [
                  {
                    data: {},
                    marks: [{ type: 'bold' }, { type: 'italic' }],
                    value: 'READ MORE….',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Health Care:',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“Republican and Democratic policies over the past fifty years are the reason health care has become so expensive. Their latest proposals to ‘fix’ health care will further micromanage your doctors and restrict your access to care while failing to solve the underlying problem. They differ only on whether this should be done by private insurance companies or government bureaucrats. This is the exact opposite of what needs to be done. We can reduce the cost of health care 75% by allowing real price competition, and by substantially reducing government and insurance company paperwork. This will make health care affordable for most Americans, while also reducing the cost of legacy programs like Medicare, Medicaid, and the VA.”',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Environment:', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“I will work to remove government barriers to replacing coal-burning and oil-burning power plants in the United States with safe, non-polluting, high-tech nuclear power plants – and allowing off-grid use of solar power. Worldwide, I believe we need to consider all scientific & economic knowledge to care for our environment, not cherry-pick data to support a pre-determined outcome. Most pollution is generated in developing countries, so reducing pollution worldwide requires cost-efficient zero emission energy sources like nuclear.”',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Social Security:',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“Do you trust politicians to keep their promises? I don’t. They’ve spent every cent in the Social Security Trust Fund on other spending, leaving behind worthless IOU’s. Other countries have successfully replaced their government-run systems with individual retirement accounts safe from greedy politicians. As President, I would work to implement a solution like the Cato Institute’s “6.2% solution”, which would allow any American the opportunity to “opt out” of the current system while making the current system fiscally stable for those who choose to remain.”',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Trade and Immigration:',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“The freedom to trade and travel are fundamental to human liberty. As American citizens, we should be free to travel anywhere we choose, and to buy and sell anywhere in the world. As President, I will use my Constitutional authority to eliminate trade barriers & tariffs, and work to repeal arbitrary quotas on the number of people who can legally enter the United States to work, visit, or reside. “',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Criminal Justice Reform:',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“I am appalled that the United States ranks number one in the world for having the highest percentage of people imprisoned. I am also appalled that the federal government permits police to seize a person’s assets without first convicting them of a crime, and then keep most of the assets seized. This is literally highway robbery. As President, I will use my Constitutional authority to end federal civil asset forfeiture prior to conviction, and pardon persons convicted of non-violent victimless crimes. I will also work with Congress to end the failed War on Drugs and other victimless crime laws.”',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Poverty:', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“From 1959 to 1969, the poverty rate was nearly cut in half while government did little to address poverty. However, after the war on poverty was fully implemented in the early seventies, progress stopped. Fifty years of federal anti-poverty programs – zero impact. Government anti-poverty programs don’t work. The real cure for poverty is a vibrant economy that generates plentiful jobs and high wages, combined with an affordable cost of living. As President, I will work to eliminate policies that cripple economic growth. I will give special attention to regulations driving up the cost of housing and health care, as well as those creating barriers to creating new businesses or entering professions. Finally, I will work to repeal laws and regulations that prevent individuals and charitable organizations from helping those in need.”',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Education:', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“The Department of Education has failed. In the forty years since the Department of Education was created, government spending on education has skyrocketed, while the quality of education has declined. Students used to be able to work their way through college and graduate debt-free. As President, I will work to eliminate the Department of Education and return control of education to where it belongs – with parents,  teachers, and students.”',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Taxes:', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“Taxes are never voluntary – they are always paid under threat of punishment. If you fail to pay what government says you owe, you can be fined, have your wages garnished, assets seized, even go to prison. Voting for more government spending inevitably leads to higher taxes to pay for it – now, or in the future. As President, I will work tirelessly to slash federal spending, make government much, much smaller, and let you keep what you earn.”',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: 'BsfHZHJyQhdwqXPl4uEIC',
      type: 'Entry',
      createdAt: '2020-04-11T20:24:19.678Z',
      updatedAt: '2020-04-11T20:33:07.566Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'researchPage' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Thanks for checking us out!',
      pageContent: {
        nodeType: 'document',
        data: {},
        content: [
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  'The Good Party would like feedback from real people about our plan empower ordinary citizens to fix the corruption in Congress. If you are interested in speaking with our team, sign up to participate by telling us a bit about yourself below.\n',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
          {
            nodeType: 'paragraph',
            content: [
              {
                nodeType: 'text',
                value:
                  '\nParticipants who are selected to participate will receive a ',
                marks: [],
                data: {},
              },
              {
                nodeType: 'text',
                value:
                  '$60 (for 60 minutes) or $30 (for 30 minutes) Amazon Gift Card',
                marks: [{ type: 'italic' }, { type: 'bold' }],
                data: {},
              },
              {
                nodeType: 'text',
                value: ' upon completion of their session.',
                marks: [],
                data: {},
              },
            ],
            data: {},
          },
        ],
      },
      signUpLink: 'https://airtable.com/shrbJLdp5uQuyHIZf',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '2Rn56BrP2Fj3ogPUvwMffw',
      type: 'Entry',
      createdAt: '2020-04-11T19:35:26.046Z',
      updatedAt: '2020-04-11T19:38:07.251Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'privacyPage' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Privacy Policy',
      lastModified: '2019-08-23',
      pageContent: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'This Privacy Policy explains how The Good Party (“we” or “us”) collects, uses, and disclose information that you may provide while visiting our website, www.thegoodparty.org, and our mobile sites, mobile applications, and other online services (the “Sites”) using a personal computer, mobile device, or any other means, and to demonstrate our firm commitment to Internet privacy. This Privacy Policy also applies to personal information collected by third-party vendors on our behalf.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'What is Personal Information?',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '“Personal Information” is information about a particular individual that specifically identifies that individual, or information about that individual, such as name, address, email address, telephone number, or credit or debit card information. Personal Information does not include “aggregate information,” which is data that may be collected automatically or without reference to Personal Information about the use of the Sites. The Privacy Policy does not restrict The Good Party’s collection and use of aggregate information.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Visitors to the Sites',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Good Party operates in the United States and the information we collect is governed by U.S. law.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Children', nodeType: 'text' },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "The Sites are not directed at children and we do not knowingly collect Personal Information directly from children (including information concerning a child or that child's parents/guardians, any screen or user name that functions as online contact information for a child, any photograph, video, or audio file containing a child’s image or voice) directly from users under the age of thirteen (13) or from other web sites or services directed at children. Consistent with the Federal Children’s Online Privacy Protection Act of 1988 (“COPPA”), we will not knowingly request or collect Personal Information from any child under the age of thirteen (13) in the United States without obtaining the required consent from the appropriate parent/guardian. Children may access and browse the Sites without disclosing any Personal Information. We will apply material changes to this Privacy Policy to conform with applicable law, including any applicable provisions of COPPA that require parental consent.\n\nPlease visit ",
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://www.ftc.gov/privacy/privacyinitiatives/childrens.html',
                },
                content: [
                  {
                    data: {},
                    marks: [],
                    value:
                      'www.ftc.gov/privacy/privacyinitiatives/childrens.html',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  ' for information from the Federal Trade Commission about protecting children’s privacy online. If you have any reservations, questions or concerns about your child’s access to the Sites or how information that your child provides is used by us, please contact us.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'COLLECTION OF PERSONAL INFORMATION',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Direct Collection',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We collect Personal Information that you provide to us when you register, send us an email, sign up to receive email or text messages, sign up to volunteer, fill out a form, make a purchase or donation, communicate with us through third-party social feeds, request information, participate in active forums or take any other action on the Sites. We (or our service providers) may also obtain information from outside sources and combine it with the information we collect through the Sites, including from voter file data from state parties and other organizations, from public databases, and from private organizations. This Policy also applies to Personal Information that we may obtain from third-party vendors such as search engines or social media sites.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Aggregate and Similar Information',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We may automatically collect information when you visit the Sites such as the Internet Protocol (IP) address, the browser and operating system you use, the name of the domain and host from which you access the Internet, the address of the website from which you linked to the Sites, device identifiers, and mobile and network information, and your actions on the Sites. This information will be treated as Personal Information if we combine or link it to any of the identifying information above. Otherwise, this information constitutes aggregate information.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Aggregate and Similar Information',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Log data provides information about the number of visits to different pages on the Sites. We use this data for troubleshooting purposes and to track which pages people visit in order to improve the Sites. We do not link log data collected to Personal Information. We may communicate with third-party vendors, including Google, and place online advertising, which will be shown on other websites on the Internet. In some cases, those third-party vendors may decide which ads to show you based on your prior visits to the Sites. At no time will you be personally identified to those third-party vendors, nor will any of the information you share with us be shared with those third-party vendors. If you prefer to opt out of the use of these third-party cookies on the Sites, you can do so by visiting the Network Advertising opt out page: www.networkadvertising.org. We may also use third-party services such as Google Analytics. This helps us understand traffic patterns and know if there are problems with the Sites. We may also use embedded images in emails to track open rates for our mailings, so that we can tell which mailings appeal most to our supporters.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Cookies and Related Technology',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We may also automatically receive and store certain types of information when you visit the Sites through the use of cookies, web beacons, or similar programs to collect the information described above. “Cookies” are small text files stored locally on your computer that help store user preferences. “Web beacons” are small pieces of code placed on websites used to collect advertising metrics, such as counting page views, promotion views, or advertising responses. We may use cookies or web beacons to measure aggregate web statistics, including the number of monthly visitors, number of repeat visitors, most popular webpages and other information. We may also use cookies to facilitate your online visit by maintaining data that you provide so that you will not need to resubmit certain information. Cookies do not contain any Personal Information and we will never track your Internet usage outside of the Sites. In many web browsers, you can choose to delete, disable, turn off, or reject most cookies and web beacons through the “Internet Options” sub-option of the “Tools” menu of your web browser or otherwise as directed by your web browser’s support feature. Please consult the “Help” section of your web browser for more information.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Petitions', nodeType: 'text' },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Any petitions that you have signed online, and any comments therewith, constitute public information that we may provide to local, state, or national political leaders and the press.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Third Party Websites',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Sites may contain links to third party websites, including social media sites. Except as expressly stated otherwise by The Good Party, we do not review the privacy practices of all other websites and recommends that you review their privacy policies and your privacy settings before sharing your Personal Information. We do not have control over third party websites and is not responsible for their privacy policies or practices. Any third parties to whom we may disclose Personal Information may have their own privacy policies that describe how they use and disclose Personal Information. Those policies will govern use, handling, and disclosure of Personal Information once we have shared it with those third parties as described in this Privacy Policy. If you want to learn more about third-party privacy practices, we encourage you to visit the websites of those third parties.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'How We Use Your Personal Information',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We may use your Personal Information for various purposes including to:',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Connect you to The Good Party programs, events, and activities, and obtain and confirm RSVP’s to events and programs;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Improve, maintain, and operate the Sites, send you receipts, confirmations, updates, notices, and messages regarding support and administration;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Provide information or products that you request and process and complete such transactions;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Respond to your emails, requests, comments, submissions, and questions, and provide customer service, request feedback, and otherwise communicate with you regarding your use of the Sites;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Help connect you with other Good Party supporters, and to solicit support, and volunteers;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Monitor and analyze trends and site usage and provide features and content that match your interests based on the information you provide and your actions on the Sites;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'To manage our operations;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'To notify you of changes to our Sites;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'To protect the interests of The Good Party, another visitor to the Sites, and/or to enforce one or more provisions of this Privacy Policy; and',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'To communicate with you, including through newsletters and email notifications, confirmations, technical notices, updates, security alerts, as well as regarding support and administrative messages that you may request.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Send you technical notices, updates, security alerts, and support and administrative messages and provide technical support;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Contact you if Federal election laws require us to request additional information from you;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Remind you to vote and register to vote and assist you in finding your registration information, polling location and campaign events near you;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Monitor and analyze trends, usage, and activities in connection with our Site;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Personalize the Site and provide advertisements, content or features based on your preferences, interests, and browsing and online activities;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Facilitate contests, sweepstakes, and promotions and process and deliver entries and rewards;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Carry out any other purpose described to you at the time the information was collected.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'How We Share Your Personal Information',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Though we make every effort to preserve your privacy, we may share Personal information as follows:',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'When we have a good-faith belief that release is appropriate to comply with the law (for example, a lawful subpoena);',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'To protect the rights or property or safety of our supporters, employees, volunteers, or others;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'With vendors, service providers, consultants, employees, contractors, or volunteers who need to know such information to carry out their duties;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'With groups, causes, organizations, or candidates we believe have similar views, goals, and principles;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'To report your name, address, occupation, employer, and amount contributed if your donation exceeds $200, as required by the FEC;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'To comply with applicable laws, statutes, or regulations and to enforce this Privacy Policy; and',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'With your consent.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'In the event of a bankruptcy or a sale, merger, or acquisition, The Good Party may transfer your Personal Information to a separate entity. That entity will be responsible for ensuring your Personal Information is used only for authorized purposes and in a manner consistent with this Privacy Policy and applicable law.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'How We Protect and Retain the Information You Provide',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Good Party uses reasonable industry-standard security measures to protect against the loss, misuse, theft, unauthorized access, destruction or alteration of the information under our control. Although we make good faith efforts to store information collected by the Sites in a secure operating environment, we cannot guarantee complete security.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We will retain your Personal Information as long as you have an active account with The Good Party, as necessary to provide you with the services via the Sites, or as otherwise set forth in this Privacy Policy. We will also retain and use Personal Information as necessary for the purposes set out in this Privacy Policy and to the extent necessary to comply with our legal obligations, resolve disputes, enforce our agreements, and protect our legal rights. We also collect, maintain, use, and share aggregated, anonymized, or pseudonymized information, which we may retain indefinitely to protect the safety and security of our Sites, improve our Sites, or comply with legal obligations.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Sharing on Social Media',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Site may offer social sharing features and other integrated tools (such the ability to share on twitter or instagram), which let you share actions you take on our Site with other media, and vice versa. Your use of such features enables the sharing of information with your friends or the public, depending on your privacy settings for the relevant social media site. For more information about the purpose and scope of data collection and processing in connection with social sharing features, please visit the privacy policies of the entities that provide these features.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'How to Unsubscribe or Opt Out',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Those who subscribe to email lists via the Sites will receive periodic updates from us by regular mail or email. You may opt out of receiving future information via email by using the unsubscribe procedure specified on the email message. With your consent, we may send promotional and non-promotional push notifications or alerts to your mobile device. You can deactivate these messages at any time by changing the notification settings on your mobile device. You may also contact us at ',
                nodeType: 'text',
              },
              {
                data: { uri: 'mailto:info@thegoodparty.org' },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'info@thegoodparty.org',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  ' if you no longer wish to receive communications regarding The Good Party or the Sites. If you opt out, we may still send you non-promotional emails, such as those about your use of the Sites.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Rejecting Cookies / Do Not Track',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove or reject browser cookies. If you choose to reject all cookies, you may be unable to use certain areas of the Sites. Some browsers have incorporated “Do Not Track” features. Most of these features, when turned on, send a signal or preference to the website or online service that a user visits, indicating that the user does not wish to be tracked. California law requires that an operator of a website or other online service disclose how the operator responds to a Do Not Track signal and whether third parties may collect personal information about an individual’s online activities from the operator’s website or online service. The Good Party is committed to providing you with meaningful choices about the information collected through the Services, however please be aware that the Internet industry is currently still working on Do Not Track standards.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'California Privacy Rights',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Effective January 1, 2005, under California Civil Code Section 1798.83, if an individual who is a California resident has provided Personal Information to a business in connection with a business relationship that is primarily for personal, family, or household purposes, and if that business has within the immediately preceding calendar year disclosed such an individual’s Personal Information to a third party and knows or should have known that such third party used the information for its own direct marketing purposes, then that business is obligated to disclose in writing to such individual upon request, what Personal Information was shared and with whom it was shared. As a non-profit, we are not a “business” subject to the California Consumer Privacy Act (California Civil Code Section 1798.135; “CCPA”) that goes into effect on January 1, 2020. Our disclosures to service providers will strive to be consistent, however, with the spirit of the CCPA as of its effective date on January 1, 2020. Any request for a disclosure required under these California laws should be sent to us via email at ',
                nodeType: 'text',
              },
              {
                data: { uri: 'mailto:info@thegoodparty.org' },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'info@thegoodparty.org',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '.', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Please note that we are not required to respond to your request more than once in a calendar year, nor are we required to respond to any request that is not sent to the email address designated above.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Account Closure',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'If you would like to stop using the Service, you should deactivate your account and contact us at ',
                nodeType: 'text',
              },
              {
                data: { uri: 'mailto:info@thegoodparty.org' },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'info@thegoodparty.org',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  '. Similarly, if you stop working with the Organisation, the Organisation may suspend Your Account and/or delete any information associated with Your Account. It typically takes about 90 days to delete an account after account closure, but some information may remain in backup copies for a reasonable period of time.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Please note that we are not required to respond to your request more than once in a calendar year, nor are we required to respond to any request that is not sent to the email address designated above.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'International Visitors',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Sites are hosted in and provided from the United States. While we do not direct our services to residents of the European Union (or European Economic Area; together, “EU”), it is possible that EU residents may access and use the Sites. If you use the Sites and/or reside in the EU, Canada, or other regions with laws governing data collection and use that may differ from U.S. law, please note that you may be transferring your personal data to the United States. The United States may not have the same data protection laws as the EU, Canada, and some other regions. By providing Personal Information, you consent to the transfer of your Personal Information to the United States and the use of your Personal Information, in accordance with this Privacy Policy. If we collect Personal Information from EU residents, we strive to do so in a manner in compliance with the General Data Protection Regulation (“GDPR”), which include acknowledgment of EU residents’ rights, including the following:',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'to withdraw your consent to the processing of Personal Information about you to which you have previously given consent;',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'to object to processing of Personal Information about you for the purpose of direct marketing; and',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'to have incorrect Personal Information about you corrected.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'You also have the right to obtain a copy of the Personal Information we have about you, although we reserve the right to charge a fee for this.z',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'California Residents',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Some browsers have incorporated “Do Not Track” features. Most of these features, when turned on, send a signal or preference to a website or online service that a user visits, indicating that the user does not wish to be tracked. California law requires that an operator of a website or other online service disclose how the operator responds to a Do Not Track signal and whether third parties may collect personal information about an individual’s online activities from the operator’s website or online service. The Good Party is committed to providing you with meaningful choices about the information collected through the Sites, however please be aware that the Internet industry is currently still working on Do Not Track standards, implementations and solutions, and therefore the Sites may or may not respond to those signals.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'California law also provides California residents with the right to receive disclosures about any sharing of their Personal Information to a business in connection with a business relationship that is primarily for personal, family, or household purposes, and if that business has within the immediately preceding calendar year disclosed such an individual’s Personal Information to a third-party and knows or should have known that such third-party used the information for its own direct marketing purposes, then that business is obligated to disclose in writing to such individual upon request, what Personal Information was shared and with whom it was shared. Any request for a disclosure required under this California law should be sent to us via email at ',
                nodeType: 'text',
              },
              {
                data: { uri: 'mailto:info@thegoodparty.org' },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'info@thegoodparty.org',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '.', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Changes to Privacy Policy',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'This Privacy Policy may be updated from time to time. When updated the “last updated" date will be amended and the new Privacy Policy will be posted online. We encourage you to check this page when revisiting the Sites to make sure that you are informed of how your personal information will be used.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'How to Contact Us',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-4',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Questions regarding this Privacy Policy should be emailed to The Good Party at ',
                nodeType: 'text',
              },
              {
                data: { uri: 'mailto:info@thegoodparty.org' },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'info@thegoodparty.org',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: 'onKULTv3KzaVGe5cLkE7K',
      type: 'Entry',
      createdAt: '2020-02-15T01:49:03.514Z',
      updatedAt: '2020-03-31T02:49:39.323Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 3,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'presidentialCandidate',
        },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Elizabeth Warren',
      info: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The following policy positions were compiled by ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'Ballotpedia',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  " from the candidate's official campaign website, editorials, speeches, and interviews.",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Immigration', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Elizabeth Warren wrote in her plan published online, "We must address the humanitarian mess at the border and reverse this president’s discriminatory policies. But that won’t be nearly enough to fix our immigration system. We need expanded legal immigration that will grow our economy, reunite families, and meet our labor market demands. We need real reform that provides cost-effective security at our borders, addresses the root causes of migration, and provides a path to status and citizenship so that our neighbors don’t have to live in fear."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Warren\'s six-point proposal on immigration includes the following. Under the heading "Eliminating Abusive Enforcement," she listed the following points: "Decriminalize migration and refocus enforcement on serious criminal activity. Separate law enforcement from immigration enforcement to strengthen our communities. Remake CBP and ICE in a way that reflects our values. Create accountability for the abuse perpetrated during the Trump Era." Warren listed the following under the heading "Significantly Reduce Immigration Detention": "End unnecessary detention. Eliminate private detention facilities. Expand the executive use of parole and invest in alternatives-to-detention." Warren listed the following under the heading "Provide Rights and Due Process in our Immigration Courts": "Establish professional, independent Article I immigration courts. Eliminate expedited removal and provide due process." Under the heading "Welcome Those In Need," Warren lists the following: "Reject exclusionary policies based on race, religion and nationality. Raise the refugee cap. Affirm asylum protections." Warren lists the following under the heading "Grow Legal Immigration and Establish a Fair and Achievable Path to Status": "Expand legal immigration. Make it easier for those eligible for citizenship to naturalize. Reduce the family reunification backlog. Repeal the 3- and 10-year bars. Provide a fair and achievable pathway to citizenship. Limit the penalties considered for status determinations. Create an Office of New Americans." Warren lists the following under the heading "Address the Forces Displacing Migrants from Their Home Countries": "Restore and increase aid. Step up efforts to address transnational crime. Inform and protect those seeking refuge." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Healthcare', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Elizabeth Warren cosponsored the Medicare for All Act of 2019. According to a press release on Warren\'s Senate website, "The Medicare for All Act of 2019 would ensure that Americans could get the care they need, when they need it, without going into debt. It would empower the federal government to negotiate prices with drug companies. And it would expand coverage to include home- and community-based long-term care services, ensuring people with disabilities can receive the care they need to stay in their homes and remain part of their communities."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Warren said of the bill, "No one should ever go bankrupt just because they got sick, or skip care worried about the cost of treatment. Health care is a basic human right, and I will always fight for basic human rights. I\'m proud to once again co-sponsor this Medicare for All bill." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Energy and environmental issues',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Elizabeth Warren wrote in a Medium post, "The world must limit warming to below 1.5° C to avoid the most catastrophic outcomes, cutting carbon pollution roughly in half by 2030 and achieving net-zero emissions by 2050. As the world’s largest historical carbon polluter, the United States has a special responsibility to lead the way. That’s why I’m an original supporter of the Green New Deal, which challenges us to go above and beyond — to launch a ten-year mobilization through 2030 to achieve net-zero domestic greenhouse gas emissions as fast as possible. My Green Apollo plan to invest $400 billion over ten years in clean energy R&D will spur innovation and help us to develop the technology we need to go the final mile. Critically, I will condition these R&D investments on any resulting manufacturing taking place right here in America, to create good middle-class jobs. My Green Manufacturing plan to invest $1.5 trillion over ten years in federal procurement of American-made clean energy products will fund the transition for federal, state, and local governments. My plan for public lands makes an unprecedented commitment to generate 10% of our overall electricity needs from renewable sources offshore or on public lands. And my Green Marshall Plan will commit $100 billion to support the export of American-made clean energy products so that we can help other countries cut their emissions too." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Trade', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'In a plan published online, Elizabeth Warren wrote, "As President, I won’t hand America’s leverage to big corporations to use for their own narrow purposes — I’ll use it to create and defend good American jobs, raise wages and farm income, combat climate change, lower drug prices, and raise living standards worldwide. We will engage in international trade — but on our terms and only when it benefits American families."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The plan goes on to call for the following: "A Trade Negotiation Process that Reflects America’s Interests," "Using Our Leverage to Demand More for American Families and to Raise the Global Standard of Living," and "Delivering for American Families with Stronger Enforcement." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Economy', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Elizabeth Warren\'s campaign website says, "After decades of largely flat wages and exploding household costs, millions of families can barely breathe. For generations, people of color have been shut out of their chance to build wealth. It’s time for big, structural changes to put economic power back in the hands of the American people."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Her campaign website continues: "That means putting power back in the hands of workers and unions. It also means transforming large American companies by letting their workers elect at least 40% of the company’s board members to give them a powerful voice in decisions about wages and outsourcing. And it means a new era of strong antitrust enforcement so giant corporations can’t stifle competition, depress wages, and drive up the cost of everything from beef to Internet access. As the wealthiest nation in the history of the world, we can make investments that create economic opportunity, address rural neglect, and a legacy of racial discrimination–if we stop handing out giant tax giveaways to rich people and giant corporations and start asking the people who have gained the most from our country to pay their fair share. That includes an Ultra-Millionaire Tax on America’s 75,000 richest families to produce trillions that can be used to build an economy that works for everyone, including universal childcare, student loan debt relief, and down payments on a Green New Deal and Medicare for All. And we can make a historic investment in housing that would bring down rents by 10% across America and create 1.5 million new jobs." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Education', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'In a plan published online, Elizabeth Warren called for canceling student loan debt for most college graduates, eliminating all tuition costs at public two- and four-year schools, and providing additional funding to historically-black institutions of higher education.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Warren summarized her plan as follows: "My plan for broad student debt cancellation will: Cancel debt for more than 95% of the nearly 45 million Americans with student loan debt; Wipe out student loan debt entirely for more than 75% of the Americans with that debt; Substantially increase wealth for Black and Latinx families and reduce both the Black-White and Latinx-White wealth gaps; and Provide an enormous middle-class stimulus that will boost economic growth, increase home purchases, and fuel a new wave of small business formation. My plan for universal free college will: Give every American the opportunity to attend a two-year or four-year public college without paying a dime in tuition or fees; Make free college truly universal — not just in theory, but in practice — by making higher education of all kinds more inclusive and available to every single American, especially lower-income, Black, and Latinx students, without the need to take on debt to cover costs. The entire cost of my broad debt cancellation plan and universal free college is more than covered by my Ultra-Millionaire Tax — a 2% annual tax on the 75,000 families with $50 million or more in wealth." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Gun regulation',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Elizabeth Warren wrote in a plan published online, "As president, I will immediately take executive action to rein in an out-of-control gun industry — and to hold both gun dealers and manufacturers accountable for the violence promoted by their products. I will break the NRA’s stranglehold on Congress by passing sweeping anti-corruption legislation and eliminating the filibuster so that our nation can no longer be held hostage by a small group of well-financed extremists who have already made it perfectly clear that they will never put the safety of the American people first. I will send Congress comprehensive gun violence prevention legislation. I will sign it into law within my first 100 days. And we will revisit this comprehensive legislation every single year — adding new ideas and tweaking existing ones based on new data — to continually reduce the number of gun deaths in America." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Criminal justice',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Elizabeth Warren\'s campaign website says, "Four words are etched above the Supreme Court: Equal Justice Under Law. That’s supposed to be the promise of our justice system. But today in America, there’s one justice system for the rich and powerful, and another one for everybody else."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Warren\'s campaign website continues, "It’s not equal justice when a kid with an ounce of pot can get thrown in jail while a bank executive who launders money for a drug cartel can get a bonus. It’s not equal justice when, for the exact same crimes, African Americans are more likely than whites to be arrested, more likely to be charged, more likely to be convicted, and more likely to be sentenced. We need criminal justice reform and we need it now. That means ending racial disparities in our justice system. It means banning private prisons. It means embracing community policing and demilitarizing our local police forces. It means comprehensive sentencing reform and rewriting our laws to decriminalize marijuana. Equal justice also demands that everybody – no matter how wealthy or well-connected – is held accountable when they break the law. That means new laws and a new commitment to prosecuting giant corporations – and their leaders – when they cheat their customers, stomp out their competitors, or rob their workers. It means judicial nominees that follow the rule of law instead of catering to the wealthy and the well-connected. It won’t be easy. But we will make structural change to fulfill the promise of our justice system. Our democracy demands it." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Foreign policy',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Elizabeth Warren\'s campaign website says, "From endless wars that strain military families to trade policies that crush our middle class, Washington’s foreign policy today serves the wealthy and well-connected at the expense of everyone else."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Her website continues, "For too long, our economic policies have left workers with the short end of the stick. We need to strengthen labor standards – and then fight to enforce them. That’s why Elizabeth will oppose Trump’s new “NAFTA 2.0” unless he produces a better deal for America’s working families. It’s time to stop prioritizing corporate profits over American paychecks. A strong military should act as a deterrent so that most of the time, we won’t have to use it. We must continue to be vigilant about the threat of terrorism, but it’s time to bring our troops home – and make sure they get support and benefits they’ve earned. We should also leverage all the tools of our national power, not just our military might. That means cutting our bloated defense budget and ending the stranglehold of defense contractors on our military policy. It means reinvesting in diplomacy and standing with our allies to advance our shared interests. It means new solutions to new global challenges, from cybersecurity to the existential threat posed by climate change. Our strength abroad is generated here at home. Policies that undermine working families in this country also erode our strength in the world. It’s time for a foreign policy that works for all Americans, not just wealthy elites." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Impeachment', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Elizabeth Warren tweeted, "No one is above the law—not even the president of the United States. Congress has the constitutional authority and responsibility to hold the president accountable. This is not about politics, this is about principle. We must begin impeachment proceedings." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Elizabeth_Warren_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '6Q8FqzXi4E27ReWSh72FlY',
      type: 'Entry',
      createdAt: '2020-03-19T05:18:51.277Z',
      updatedAt: '2020-03-31T02:48:33.755Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 5,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'presidentialCandidate',
        },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Howie Hawkins',
      website: 'https://howiehawkins.us/',
      facebook: 'https://www.facebook.com/howiehawkins',
      twitter: 'https://www.twitter.com/howiehawkins',
      info: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [{ type: 'italic' }],
                value: 'From',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'italic' }, { type: 'bold' }],
                value: ' ',
                nodeType: 'text',
              },
              {
                data: { uri: 'Howiehawkins.us' },
                content: [
                  {
                    data: {},
                    marks: [{ type: 'italic' }, { type: 'bold' }],
                    value: 'HowieHawkins.us',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [{ type: 'italic' }],
                value: ' website, ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'italic' }, { type: 'bold' }],
                value: '"',
                nodeType: 'text',
              },
              {
                data: { uri: 'https://howiehawkins.us/why-im-running/' },
                content: [
                  {
                    data: {},
                    marks: [{ type: 'italic' }, { type: 'bold' }],
                    value: "Why I'm running",
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [{ type: 'italic' }, { type: 'bold' }],
                value: ',',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'italic' }],
                value: '" Published May 28th, 2019.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'I write to let you know that I have decided to seek the Green nomination for president of the United States.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'I have decided to run because so many Greens and independent progressives and socialists have urged me to. We have conceived of a campaign designed to grow the Green Party rapidly as we move into the 2020s and provide real solutions to the climate crisis, the new nuclear arms race, and ever-growing economic and racial inequality.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'I am not out here running by myself. I am running with a collective leadership.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The group that drafted me to run is deeply experienced and diverse in terms of race, gender, sexual orientation, and age.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'They include former Green Party vice-presidential candidates Cheri Honkala and Ajamu Baraka; national party co-chairs Andrea Mérida, Tony Ndege, and Margaret Flowers; peace activist Cindy Sheehan; veterans of the black liberation movement like Bruce Dixon and Asantewaa Nkrumah-Ture; progressive commentators like Chris Hedges and Kevin Zeese; the environmental scientist and DC Statehood Green Party stalwart David Schwartzman; political economist and Green New Deal policy expert Jon Rynn; the former county supervisor, almost-mayor, and public defender in San Francisco, Matt Gonzalez; and so many others.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'CAMPAIGN GOALS',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Draft Howie team has worked hard to get this campaign ready to go. Together we have conceived of a campaign with two fundamental goals:',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'To build the Green Party as an activist and viable opposition to the two-capitalist-party system of corporate rule.',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'And to put our ecosocialist program for real political and economic democracy, civil liberties, social justice, ecological sustainability, and peace on to the public agenda.',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
            ],
            nodeType: 'unordered-list',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Even as we prepared to launch this campaign, two members of our core campaign team, Margaret Flowers and Kevin Zeese, camped out in the Venezeulan Embassy for five weeks resisting the US-sponsored coup attempt. That combination of movement activism and electoral politics is the model for our campaign.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Given who has asked me to run and how hard they have worked to get a campaign organized, I cannot refuse. I’m a retired Teamster now with pension. I don’t have the excuse of having to punch a time clock every night.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'So I am honored and humbled that you have brought us to this point. I will work as hard as I can full time for the rest of the campaign to live up to the awesome responsibility you have asked me to take on.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Our campaign is about providing real solutions to the life or death issues we face:',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'the fast-approaching existential threat of a climate holocaust that could wipe out human civilization;',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'the new nuclear war race that is equally an existential threat to our survival;',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value:
                          'and the unacceptable but all too real crises that so many working families face every month trying to pay for food, rent, utilities, medical bills, child care, college tuition, and/or student loans, which results in a gap of 20 years life expectancy between our poorest and richest communities.',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
            ],
            nodeType: 'unordered-list',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The two-capitalist-party system of corporate rule has utterly failed to provide real solutions to these pressing problems.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Our campaign is about building up the Green Party into a major party over the coming elections cycles so that we can enact the real solutions that the Democrats and Republicans will not. We want to put the Green Party in the position of electing thousands of Greens to local offices, state legislatures, and Congress as we move into the 2020s.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'IMPEACH TRUMP NOW',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Our campaign is about uncompromising opposition to the racism and authoritarianism of Trump as well as to the self-defeating dependent politics of so many progressives who count on the corporate Democrats to defeat the ultra-right and enact progressive reforms. We are committed to independent politics, speaking up for our solutions without compromise, running our own candidates so progressive voters cannot be taken for granted by the Democrats, and defeating the ultra-right with a positive program for the people. The Democrats’ “Not Trump” is not enough.\nDemocratic leaders say impeaching Trump would be divisive. But Trump divides the country every day with his racist tropes and incitements to violence.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Trump has a 40-year rap sheet of corporate and personal crimes, followed by crimes and abuses of power since the day he became president. Only a rich white man like Trump could expect to still be walking free. The Republicans would have impeached Obama instantly for any of Trump’s transgressions. What are the Democrats waiting for?',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We don’t have to wait to 2020 to get rid of Trump. Impeach Trump now!',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'That is only one among many reasons why the Greens need to run a presidential ticket and Green candidates right down the ballot in 2020.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Greens are the progressive alternative to the Democrats’ and Republicans’ bipartisan consensus for neoliberal austerity economics and neoconservative imperialist foreign policies.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Our campaign is about taking power from the super-rich and the giant corporations and their paid-for political representatives in the Democratic and Republican parties. Our campaign is about putting power in the hands of the working class majority through new institutions of economic and political democracy that will give the people the power to enact policies that promote human freedom, social justice, economic security, ecological sustainability, and world peace.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'FOR AN ECOSOCIALIST GREEN NEW DEAL',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The central theme of our campaign is an Ecosocialist Green New Deal.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Green Party’s Green New Deal encompasses an Economic Bill of Rights and a Green Economy Reconstruction Program.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'ECONOMIC BILL OF RIGHTS',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The Economic Bill of Rights starts with a ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Job Guarantee',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '—a WPA-style program of public jobs for the unemployed, planned locally and funded federally.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'We are campaigning for the right to ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'a minimum wage that is a living wage—$20 an hour',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value: ' indexed to inflation and productivity.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'We are campaigning to end poverty now with a ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'guaranteed income above poverty',
                nodeType: 'text',
              },
              { data: {}, marks: [], value: '.', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'We are campaigning for ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'decent homes for all',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value: '. We want to build quality ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'public housing',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' until everyone has access to affordable housing. In the meantime, we want ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'universal rent control',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' to stop the evictions, displacement, and homelessness increasing all across the country.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'We are campaigning for ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'comprehensive health care for all',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value: '. We are calling for ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'a community-based National Health Service',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ', not just a Medicare-for-All National Health Insurance program that leaves income-maximizing providers and drug companies feeding at the trough of single-payer public insurance. With its democratically-elected local health boards and with doctors and other providers on salary in public clinics and hospitals, a National Health Service will be more accountable and better at controlling costs.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our Economic Bill of Rights includes the right to ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'lifelong, tuition-free public education',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ', from child care and pre-K through K-12 to college, technical, and graduate studies at any age. We want to boost federal funding of public schools to reduce student-teacher ratios to 15-to-1 for pre-K through 12th grade.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'We want ', nodeType: 'text' },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'a secure retirement for all',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ', starting with a doubling of Social Security benefits.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The economic security provided by this Economic Bill of Rights will help us build the political majority we need to carry through our Green Economy Reconstruction Program.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: '100% CLEAN ENERGY BY 2030',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Our program will get the United States to 100% greenhouse gas reductions and clean renewable energy by 2030. That is the deadline pressing down upon us. The best climate science says rich countries must achieve this goal if the world is avert runaway global warming.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign is demanding an immediate nationwide ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'ban on fracking and all new fossil fuel infrastructure',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. If we don’t stop building fracking wells and pipelines, fracked-gas power plants, and fracked-oil vehicles, this new infrastructure will lock us into another 40 years of fossil fuels and a civilization-ending climate holocaust.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'This rapid conversion of all sectors using energy requires ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'a World War II-scale mobilization',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. In World War II, the federal government took over or built a quarter of all manufacturing capacity in the United States in order to turn industry on a dime to build the “Arsenal of Democracy” that helped defeat the Nazis. We need to do nothing less to defeat climate change.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'GREEN ECONOMY RECONSTRUCTION PROGRAM',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'That is why we call for an ecosocialist Green New Deal. Exxon and the Koch Brothers will never reinvest their fossil fuel profits in renewables. We must nationalize Big Oil and the power and gas utilities into a democratically-managed public energy system.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'In order to get to 100% clean energy we must convert all sectors of production to ecologically sustainable technologies, from agriculture and manufacturing to transportation, urban structures, and habitat restoration.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The ecosocialist Green New Deal will build ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'green manufacturing',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. We will rebuild manufacturing in the United States on the basis of zero-waste clean technologies, from manufacturing’s machine tool core to the manufacturing of intermediate and consumer goods.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Green New Deal will convert corporate agribusiness to ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'organic agriculture',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. Conversion to regenerative agriculture is needed to combat climate change by drawing atmospheric carbon into the biosphere and to end the pesticides and habitat destruction of industrial farming that is a major cause of the mass extinctions of species now underway.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We want to replace monocultural, chemicalized, and industrialized corporate agribusiness with family and cooperative organic farms. We want parity pricing and supply management programs for all agricultural commodities in order to insure famers and farmworkers receive a decent income above their costs of production.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The Green Economy Reconstruction Program will ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'rebuild our railroads for electrified transportation powered by clean renewable energy',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. We want to prioritize public freight rails, light-rail mass transit, and high-speed inter-city rails over private trucks and cars on the roads.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Our transportation program will enable the restructuring cities and towns into ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'walkable communities',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' centered around the hubs and spokes of these electrified rail systems.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Green Economy Reconstruction Program includes restoring the natural capital on which the human economy depends. We will create a new ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Civilian Conservation Corps',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' to draw down carbon and end mass extinctions by restoring forests, wetlands, mangroves, and other ecosystems.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'ECOSOCIALISM', nodeType: 'text' },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'All these transformations require ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'economic democracy based social ownership and democratic planning of the big banks and industries',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. Profit-seeking in markets has not and will not solve these ecological problems. It is time for democratic government to be the solution, not the problem.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Our ecosocialist Green New Deal will revive the economies of the Rust Belt, inner cities, and rural America.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'We will build ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'clean, zero-waste Green New Deal factories in every congressional district',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. We will replace the military/industrial complex that has done this to fortify political support for its wasteful budgets with a green/industrial complex.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'What will do differently with mobilization is that we are not going to give the factories we build to the super-rich and their giant corporations as was done after World War II.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'This time we are going to ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'spread the wealth by turning the factories over to the workers as worker-owned cooperatives',
                nodeType: 'text',
              },
              { data: {}, marks: [], value: '.', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'PAYING FOR THE GREEN NEW DEAL',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We are going to pay for this Green New Deal with more progressive taxes on income, wealth, and estates; with ecological taxes on carbon and other pollution and resource extraction; and with expansive monetary policies.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The bottleneck for the Green New Deal is labor, not technology or capital.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Renewable energy is already cheaper than fossil and nuclear fuels, especially when their subsidies are removed. There is plenty of capital in the economy to invest in a Green New Deal. US capitalists have $6 trillion in liquid assets they have invested in financial markets, which just rearranges and further concentrates who owns the productive assets we already have. The world’s capitalists have over $20 trillion hidden away in more than 80 offshore tax havens. All this money could be used for investments in the real economy of production. This unproductive capital must be taxed and channeled through the public sector for investment in new Green New Deal productive assets.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'BUDGET FOR AN ECOSOCIALIST GREEN NEW DEAL',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'The ', nodeType: 'text' },
              {
                data: {
                  uri:
                    'http://economicreconstruction.org/GreenNewDealPlan?utm_source=General+Email+List&utm_campaign=837ba14940-EMAIL_CAMPAIGN_2019_07_23_12_17&utm_medium=email&utm_term=0_84d58e79d6-837ba14940-',
                },
                content: [
                  {
                    data: {},
                    marks: [{ type: 'bold' }],
                    value: 'Green New Deal budget',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value: ' we are releasing today shows it will create over ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: '23 million jobs',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ', including over 5 million manufacturing jobs. The real unemployment last month was 15.6 million, or 9.3%. That number includes part-timers who want full-time jobs and people who want jobs but are discouraged from looking because they can’t find work and thus not counted in official statistics. That means we have plenty of work for the people migrating to the United States.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We are releasing the policies and budget for this ecosocialist Green New Deal today as ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'the standard against which any Green New Deal proposal must be measured',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. The Green parties of the world are the original Green New Dealers. Some Democrats have taken the brand, but they have diluted the content. That is another reason why Greens up and down the ticket must run in 2020.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The budget for the ecosocialist Green New Deal requires about $2 trillion a year in public investments. Private investment in the economic transition will be leveraged by the public investment and the business opportunities it creates.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Some of this money will come from a more just tax system. It is better to tax the rich upfront than to borrow money from them with bonding and the transfer more of our wealth to them through interest payments on the debt.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'But some of the money will have to be borrowed or created by the government.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'We want to ', nodeType: 'text' },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'capitalize Green New Deal public banks',
                nodeType: 'text',
              },
              { data: {}, marks: [], value: ' ', nodeType: 'text' },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'in every congressional district',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' that can finance Green New Deal projects at lower cost because they operate at cost rather than profit-maximization and they bypass the Wall Street banks’ fees and commissions. The state Bank of North Dakota has shown us how to do this for a century.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The federal government will also need to create or borrow money for a portion of these investments.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We support the Green Party’s modern Greenback platform plank to ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'nationalize the Federal Reserve into a Monetary Authority in the Treasury Department',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' with the power to create money as digital money or paper United States Notes (Greenbacks) and spend it into the economy. This debt-free money is our preferred method.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'But pending enactment of that reform, we support a policy of ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Green Quantitative Easing',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ', only this time instead of bailing out the big banks, we will bail out the people and the planet. Green QE involves bonding for Green New Deal projects. It will increase the national debt, but as long as the dollar is the world’s reserve currency we can borrow as much as we need for the Green New Deal until the economy is at full capacity without risking inflation.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'In any case, it will cost us far more if we ignore the existential threat of climate change.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'PEACE POLICIES',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We also want to get the federal government’s priorities straight. The bloated military budget, including the departments of Defense, Energy, and Homeland Security is now over $1 trillion a year.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'We want to ', nodeType: 'text' },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'cut the military budget by 75%',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' in order to increase our security. The biggest security threat we face is climate change. A $250 billion military budget will still be the world’s largest. It is far less costly in terms of personnel and weapons to defend a home territory than to invade and occupy foreign territory.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'We are demanding that the US adopt a ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'non-offensive defense posture',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ', withdraw from over 800 foreign military bases, and be the world’s humanitarian superpower instead of its global military empire. Let’s make friends instead of enemies. Let’s help poor countries provide their people with clean water, elementary education, and preventive medicine. Let’s help them leap over the fossil fuel age into the solar age. Let’s use the savings from military spending to invest in a ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Global Green New Deal',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. That is how we make peace with the world’s peoples and the planet.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign is about putting ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'nuclear disarmament',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' back on the world’s agenda. The US has failed to live up to its disarmament responsibilities under Nuclear Non-Proliferation Treaty. The Obama administration initiated new nuclear arms race with its $1 trillion nuclear weapons modernization program. The Trump administration followed that up by withdrawing from the Intermediate-Range Nuclear Force treaty as well as the Iran nuclear deal. These developments mean that the US and its adversaries are now developing tactical nukes for conventional battlefields, which will easily escalate to strategic nukes and global nuclear annihilation. Our campaign calls for a recommitment to negotiations for global nuclear abolition. We demand that the US honor its treaty obligations and restore the Intermediate Nuclear Force treaty and the Iran nuclear deal. As immediate steps, we demand that the US take its nuclear weapons off hair-trigger alert, adopt a No First Use policy, and unilaterally disarm to a minimum credible nuclear deterrent. The US should then follow up those peace initiatives with urgent negotiations for complete global nuclear disarmament as provided for in the 1970 Nuclear Non-Proliferation Treaty and demanded by the text of the Treaty on the Prohibition of Nuclear Weapons approved by 122 nations in 2017.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'GREEN NEW DEAL VS. NEO-FASCISM',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign sees itself as part of an ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'international movement for a Global Green New Deal.',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' It is the rallying cry for a program for economic prosperity and climate sanity that can unite Greens, socialists and progressives, as we just saw in late May with the strong gains by the Greens who campaigned for a Green New Deal in the European Parliament elections last weekend.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Green New Deal is the program with which we can build the political majorities to defeat the rising ultra-right of Trump and his neo-fascist counterparts around the world. The Green New Deal is a positive program of hope that can defeat the neo-fascists’ negative program of fear based on racism, xenophobia, fact-free irrationalism, and authoritarianism.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'ECONOMIC AND RACIAL JUSTICE',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Green New Deal is the centerpiece of an aggressive program to reverse the economic and racial inequality that has been growing for the last four decades in the United States.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Economic Bill of Rights will provide a floor of economic security for all Americans. The promotion of public enterprises and worker cooperatives will distribute income from work more equitably in the first place at the point of production than tax and transfer programs after income has been inequitably distributed.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Beyond these universal programs, our campaign will undertake ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'race-conscious programs to remedy the race-conscious injuries',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' of slavery, disenfranchisement, dispossession, discrimination, and segregation.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Racial justice starts with enforcing the anti-discrimination laws already on the books concerning employment, education, and housing, which have been neglected by both major parties.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'We call for ', nodeType: 'text' },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'reparations for African-Americans',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' for four centuries of slavery and discrimination.. We call for passage of the House Resolution 40, the Commission to Study and Develop Reparation Proposals for African-Americans Act.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'But we don’t want to wait for the reparations study to make a down-payment on reparations now. That down-payment is what the Economic Bill of Rights is. It encompasses the demands that the 1963 March on Washington for Jobs and Freedom, where Martin Luther King, Jr. said black and poor people had come to collect on the nation’s “promissory note” to them. That promissory note was to be fulfilled by an Economic Bill of Rights. It was carried forward by King and other civil rights leaders with the 1966 Freedom Budget and the 1968 Poor People’s Campaign. We are here to say it is way past time for America to make good on its promissory note and enact this Economic Bill of Rights, which President Franklin Roosevelt called upon Congress to enact in his last two State of the Union addresses in 1944 and 1945.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Racial justice means ending this nation’s horrific immigration policies that separate children from their parents and deny due process to immigrants seeking asylum from violence and political persecution. Our campaign calls for ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'open borders',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' like within the European Union. After after checking in at an official border crossing, people who are not wanted for a crime should be free to travel in and out of the United States. International borders should be authentic fair-trade zones where people are free to travel across borders to work, shop, recreate, and reside.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign is about ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'fair trade',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' in commodities and capital while protecting the human right to freedom of movement. We want trade agreements to be reformed or replaced to benefit working people and protect the environment in the US and around the world. We oppose the corporate-managed trade agreements that have enabled global corporations to play the workers of different countries off against each other in a race to the bottom that has undermined unions, wages, benefits, and safety and environmental standards. We support domestic content laws to enable the US to rebuild its manufacturing base to implement the Green Economy Reconstruction Program. Secret trade tribunals to which only corporations and governments have access to adjudicate trade disputes must be replaced with public courts to which citizens and unions have access.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'SOCIAL JUSTICE AND CIVIL LIBERTIES',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign is about ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'ending the war on drugs and mass incarceration',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. We call for the legalization of marijuana and the decriminalization of other drugs on the model of the Portuguese harm reduction policies. Drug abuse is a health problem, not a criminal problem. Criminalizing opioids contributes to the carnage of fatal overdoses. Addicts need help, not incarceration. Drug abuse treatment should be available on demand.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The criminal justice system needs major reforms. We support aggressive ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'federal action against white nationalist terrorism',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' and federal intervention against local police misconduct.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign will defend ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'abortion rights and reproductive freedom',
                nodeType: 'text',
              },
              { data: {}, marks: [], value: '.', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'We will campaign for the ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'freedom of the LGBTQIA+ community',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ', in particular for passage of the Equality Act to amend the Civil Rights Act to prohibit discrimination based on sexual orientation and gender identity in employment, education, housing, credit, public accommodations, adoption, foster parenting, public spaces and services, federally-funded programs, military service, and jury service.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign is about aggressive action to ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'reduce the off-the-charts gun violence',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' in America. We respect the right of law-abiding adults to own pistols, rifles, and shotguns. But we demand basic gun safety measures to protect public safety, including universal background checks, a ban on the sale of, and a buyback program for, military assault weapons, and “red flag” laws to remove firearms with due process from individuals who may present an imminent danger to themselves or others.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign will defend our ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'civil liberties',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. We will fight against the prosecution whistleblowers and publishers under the 1917 Espionage Act, which has always been used for political repression and never more so than during the last two administrations. The Assange indictments under the Espionage Act are a full-out assault on freedom of the press. We call for a total ban on warrantless mass surveillance by our government.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'REAL SOLUTIONS CAN’T WAIT',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'To those who say these demands and Green candidates have to wait until Trump is removed in 2020, we say join us in demanding that Trump be impeached now.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'To those who say Greens will split the vote and enable the Republicans to win, we say join us in fighting for the ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'ranked-choice popular vote for president and proportional representation in Congress',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' in order to end the vote-splitting dilemma once and for all.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Two of the last three presidents lost the popular vote. The Democrats, who won the popular vote but lost the presidency in those elections, but have never campaigned to abolish the Electoral College and replace it with a ranked-choice popular vote for president. That is exactly why the Green Party must run candidates—to put proposals like this into public debate that the two capitalist parties ignore.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Democrats have their billions in campaign funds. Trump is the most unpopular president in history. If the Democrats can’t landslide Trump in 2020 (if he is not impeached, convicted, and removed from office first), they can’t do anything.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The majority of congressional Democrats and their leadership share the militaristic foreign and military policies of Trump and the Republicans. They have supported Trump in increasing military spending, funding the new nuclear arms race, and in the regime-change war against Venezuela.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Those are more reasons why we need the Green alternative now, not after 2020.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'While some congressional Democrats support Medicare for All and the Green New Deal, most of them do not. And even those who took the brand of the Green New Deal into Congress watered down the content that the Green Party has campaigned for over the last decade.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The Nonbinding Resolution for a Green New Deal introduced into Congress by Representative Alexandria Ocasio-Cortez and Senator Ed Markey extended the deadline for zero greenhouse gas emissions for 2030 to 2050. It cut the ban on fracking and new fossil fuel infrastructure. It cut the deep reductions in military spending with the savings to be invested in a Global Green New Deal.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Then Speaker Pelosi would not bring this diluted Green New Deal to the House floor for a vote. On the Senate side, Leader McConnell brought it for a vote and not a single Democratic senator voted for it.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'We will be damned if we wait on the Democrats while the planet burns.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'BUILD THE GREEN PARTY',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-2',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'I am asking you to join us in this campaign. It will only be successful if we have tens of thousands of small donors and activists on the ground. The major thrust of our campaign activities in 2019 will be helping the Green Party ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'get on the ballot in all 50 states and the District of Columbia',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  '. The US has the most restrictive ballot access laws of any electoral democracy in the world. And the Democrats and Republicans designed the system that way. But we are going to beat their system anyway.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign will ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://hawkins2020.net/statematch/?utm_source=General+Email+List&utm_campaign=837ba14940-EMAIL_CAMPAIGN_2019_07_23_12_17&utm_medium=email&utm_term=0_84d58e79d6-837ba14940-',
                },
                content: [
                  {
                    data: {},
                    marks: [{ type: 'bold' }],
                    value: 'qualify for federal matching funds',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  ' early so we can start receiving matching funds at the earliest possible date, January 1, 2020. That means you contributions of up to $250 will be doubled by federal matching funds. The major party candidates, who are so flush with corporate money, refuse matching funds so that they can go far over the spending limits of the matching funds program.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Our campaign will employ experienced organizers to ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'help Green Party locals get better organized and support down-ticket Green candidates',
                nodeType: 'text',
              },
              { data: {}, marks: [], value: '.', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Our campaign will be helping our local Green parties and candidates to ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value:
                  'expand the party base among the working class, youth, and people of color',
                nodeType: 'text',
              },
              { data: {}, marks: [], value: '.', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '4WqAUxk2Q4TK3ynijDqnJT',
      type: 'Entry',
      createdAt: '2020-03-23T02:18:14.138Z',
      updatedAt: '2020-03-23T02:18:14.138Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 1,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'presidentialCandidate',
        },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Andrew Yang',
      website: 'https://www.yang2020.com/',
      facebook: 'https://www.facebook.com/andrewyang2020/',
      twitter: 'https://www.twitter.com/AndrewYang',
      info: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The following policy positions were compiled by ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'Ballotpedia',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  " from the candidate's official campaign website, editorials, speeches, and interviews.",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Immigration', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang\'s campaign website says, "Immigrants have been a source of hard work and innovation for America over the centuries. Without a doubt, the melting pot of our country has led to the most dynamic, most creative, and most successful nation in the history of the world. It’s also necessary to recognize that, as a nation, we need to maintain control of our immigration system. The current system we have in place, when it works, does a great job of ensuring that highly skilled, hard-working, and invested immigrants can come to this country and integrate, becoming new Americans who contribute greatly to our society."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Yang\'s website lists the following immigration proposals: "Secure the southern border and drastically decrease the number of illegal entries into the US. Provide a new tier of long-term permanent residency for anyone who has been here illegally for a substantial amount of time so that they can come out of the shadows, enter the formal economy, and become full members of the community. Invest heavily in an information campaign to inform immigrant communities of this new tier of residency, and deport any undocumented immigrant who doesn’t proactively enroll in the program." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Healthcare', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang\'s campaign website says, "We need to fix our broken healthcare system by tackling the root problems through a six-pronged approach: Control the cost of life-saving prescription drugs, through negotiating drug prices, using international reference pricing, forced licensing, public manufacturing facilities, and importation. Invest in technologies to finally make health services function efficiently and reduce waste by utilizing modernized services like telehealth and assistive technology, supported by measures such as multi-state licensing laws. Change the incentive structure by offering flexibility to providers, prioritizing patients over paperwork, and increasing the supply of practitioners. Shift our focus and educating ourselves in preventative care and end-of-life care options. Ensure crucial aspects of wellbeing, including mental health, care for people with disabilities, HIV/AIDs detection and treatment, reproductive health, maternal care, dental, and vision are addressed and integrated into comprehensive care for the 21st century. Diminish the influence of lobbyists and special interests in the healthcare industry that makes it nearly impossible to draft and pass meaningful healthcare reform." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Energy and environmental issues',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang\'s campaign website says, "Climate change is an existential threat to humanity and our way of life. It should be a top priority of the federal government to implement policies to control anthropogenic climate change while working with other governments to implement these policies throughout the world. It’s important to regulate fossil fuels, both to control climate change and to improve the health of the average American. Renewable energy must be invested in, not only as a means of moderating climate change but also to drive economic growth."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Yang\'s website lists the following proposals: "Invest heavily in carbon capture and geoengineering technologies designed to reverse the damage already done to the environment through a new Global Geoengineering Institute and invite international participation. Invest in any idea that has the potential to reverse the damage done to the environment, for example cloud-seeding technology to increase the atmosphere’s reflectivity. End the current tax benefits and cuts given to fossil fuel companies which give them an unwarranted competitive advantage over alternative energy sources. Institute a tax on emissions that will fund health care initiatives and research for respiratory diseases that are a direct result of these emissions. Empower and appoint an action-oriented leader of the EPA and direct the EPA to regulate carbon emissions. Direct the EPA to survey the states and private organizations to collate all programs designed to promote renewable energy adoption. Direct the EPA to coordinate with state and local governments to measure the impact of different policies on effecting positive impacts in the area of renewables adoption. Prioritize sustainable infrastructure and urban development to take advantage of new materials and designs." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Trade', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang\'s campaign website says, "We need to ensure that our trade deals with other countries match our values and environmental goals. We need to renegotiate our trade deals that protect the fossil fuel industry. Instead, our trade deals need to ensure that any goods manufactured using unsustainable methods are appropriately costed, and the fossil fuel industries don’t get unwarranted power in the deals. As President, I will: Ensure that any trade negotiation includes stringent environmental standards. Ensure that any trade deal doesn’t include carve-outs or exclusives for oil, gas, or coal. Renegotiate any trade deal that includes carve-outs for fossil fuel industries, including the ISDS exceptions in NAFTA/USMCA." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Economy', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang\'s campaign website says, "We need to make the markets serve us rather than the other way around. Profit-seeking companies are organized to maximize their bottom line at every turn which will naturally lead to extreme policies and outcomes. We need government leaders who are truly laser-focused on the public interest above all else and will lead companies to act accordingly."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'His website continues, "As president, I will implement the Freedom Dividend, providing Universal Basic Income of $1,000/month to all American adults over the age of 18 so that we may all share in the prosperity we have contributed to and participate in the new economy. Change the way we measure the economy, from GDP and the stock market to a more inclusive set of measurements that ensures humans are thriving, not barely making it by. Rein in corporate excesses by appointing regulators who are paid a lot of money – competitive with senior jobs in the private sector – but then will be prohibited from going to private industry afterward. The government’s goal should be to drive individuals and organizations to find new ways to improve the standards of living of individuals and families on these dimensions." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Education', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang\'s campaign website says, "The purpose of education should be to enable a citizen to live a good positive, socially productive life independent of work and further education. We need to make school more relevant to our young people by teaching them things they might actually use every day."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Yang\'s website lists the following education proposals: "Promote leaders in the Department of Education that promote life-skills education at least as much as higher education. Promote leaders in the DOE who envision trade skills as an educational path in secondary school. Increase funding to vocational programs within public schools. Direct the Dept. of Education to provide materials to all public schools about career paths that don’t require a college degree. Prioritize career paths that students express interest in rather than giving blanket advice that college is the right/only option. Begin a public education campaign championing vocational jobs and education. Work with states to fund their educational systems to improve teacher salaries and reduce layers of administration, leading to better educational outcomes. Direct the Department of Education to work with states to create a plan for universal pre-kindergarten education. Provide loan forgiveness for education majors who volunteer at places that provide pre-K education." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Gun regulation',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang\'s website says, "Most Americans agree on common-sense safety requirements and restrictions on firearms. As President, I will support sensible regulation of guns that allows their continued enjoyment by responsible gun owners in a framework that promotes the overall public safety."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Yang\'s website lists the following proposals: "Close the gun show and Charleston loopholes, requiring all gun sales and most transfers to have a background check run and completed. Implement a purchase limit (rate, not total) on all firearms. Implement a federal cooling-off period to decrease the incidence of suicide and impulsive crime. Promote a stringent licensing system, with a 5-year renewal requirement, for gun ownership. Create a clear definition of “assault weapon”, and prevent their manufacture and sale. Renew a ban on Large Capacity Ammo Feeding Devices (LCAFDs) and after-market non-standard large capacity magazines. Pass a federal gun transportation law that will require people to transport guns unloaded and locked in a storage safe. Increase liability for individuals who sell guns illegally that are used to commit a crime. Form a commission to study the development of 3D printing technology to see ways we can minimize the risk of this technology in perpetuating gun violence. Maintain current restrictions on and definitions of automatic weaponry. Create federal safety guidelines for gun manufacture and distribution, similar to federal car safety requirements, with strict penalties for the violation of these guidelines. Invest in personalized gun technology that makes it difficult or impossible for someone other than a gun’s owner to fire it, and ensure that they’re for sale on the marketplace. Implement a federal buyback program for anyone who wants to voluntarily give up their firearm." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Criminal justice',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang\'s website says, "Our rates of incarceration are 4 times higher than most other industrialized countries, and it’s a national disgrace. People on both sides of the aisle now recognize that our system is badly in need of reform. Our criminal justice system is particularly punitive toward blacks and other minorities. As President I will overhaul the treatment of drug offenses and reduce our rates of incarceration over time."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Yang\'s website lists the following proposals: "Work to end the use of private prison facilities for federal inmates. Shift drug policy away from punishment and towards treatment. Invest money to fund innovative prison programs that decrease recidivism and increase reintegration. Invest money to support businesses that hire felons who have served their prison term. Push to reconsider harsh felony laws that prevent those who have served their prison term from reintegrating into society. Identify non-violent drug offenders for probation and potential early release. Implement Universal Basic Income which will dramatically decrease incentives for criminality and improve the functioning of individuals and communities." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Foreign policy',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang\'s website says, "My first principles concerning foreign policy are restraint and judgment - we should be very judicious about projecting force and have clear goals that we know we can accomplish. We should treat our men and women in the armed services as the brave and self-sacrificing leaders that they are, both during and after their deployments. If I send young men and women into harm’s way, they will know that vital national interests are at stake and there is a clear plan for them to achieve their goal in a reasonable time frame."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Yang\'s website lists the following proposals: "Work with our allies to rebuild our stature in the world, and strengthen alliances such as NATO. Reinvest in diplomacy and bolster funding to the State Department. Work with allies to project our combined strength throughout the world, without engaging in activities that will cost American lives and money with no clear benefit to our long-term well-being. Sign a repeal to the AUMF, returning the authority to declare war to Congress, and refuse to engage in anything other than emergency military activity without the express consent of Congress. Regularly audit the Department of Defense. Focus our federal budget on fixing problems at home instead of spending trillions of dollars abroad." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Impeachment', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Andrew Yang tweeted, "Given the President’s latest actions I think impeachment is the right path forward. Asking foreign leaders for political help in return for aid and then suppressing your own agency’s inquiry is egregious. There have to be limits and Congress is right to act." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Andrew_Yang_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5ql1EpkkG5qRFalRYDeUVo',
      type: 'Entry',
      createdAt: '2020-02-15T01:56:03.278Z',
      updatedAt: '2020-03-23T02:18:03.497Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 3,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'presidentialCandidate',
        },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Tulsi Gabbard',
      website: 'https://www.tulsi2020.com/',
      facebook: 'https://www.facebook.com/profile.php?id=1355628165',
      twitter: 'https://www.twitter.com/tulsigabbard',
      info: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The following policy positions were compiled by ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'Ballotpedia',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  " from the candidate's official campaign website, editorials, speeches, and interviews.",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Immigration', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Tulsi Gabbard\'s campaign website says, "We need comprehensive immigration reform to address our broken immigration laws and we need to have a serious conversation about the most effective and humane ways to compassionately secure our borders while building bridges and cooperative foreign policy with other countries. We need to ensure we have a clear, enforceable, accessible, and humane pathway to citizenship. Most urgently, we must pass DACA to ensure children who know no other home are allowed to remain in the US and take steps to ensure children are not separated from their parents. We must fund and equip agencies in charge of processing asylum claim and protect migrants, many of whom are women and children, who are going through our asylum process and fleeing natural disasters, religious persecution, or violence under an asylum status." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Healthcare', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Tulsi Gabbard\'s official government website says, "We need real healthcare reform that brings down costs, increases access to quality care, and ensures basic health services are available to all Americans. As a cosponsor of H.R.676, the Expanded & Improved Medicare for All Act, Tulsi Gabbard is working towards a system that will provide universal healthcare to all Americans—a standard met by nearly every other major industrialized country in the world. We need a system that puts people first, ahead of the profits of insurance and pharmaceutical companies. The Medicare for All Act is an important step forward." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Energy and environmental issues',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Tulsi Gabbard\'s campaign website says, "As president, I’ll tackle climate change by ending subsidies to big fossil fuel and agribusiness corporations, ban offshore drilling, harness innovation to create jobs in renewable energy, provide better opportunities for our farmers, and ensure every American has clean air and water. We need to invest in 100% renewable and safe energy sources like wind, solar, and geothermal. I also support a ban on fracking, ending the $26 billion/year in fossil fuel subsidies, as well as all subsidies or waivers to the nuclear power industry, which should itself be completely responsible for paying for its own insurance and paying the long term cost for safe storage of nuclear waste over centuries. I will also work to provide other incentives for a renewable energy economy.” ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Trade', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Tulsi Gabbard tweeted, "Trump’s trade wars are a disaster. Billions in bailouts to farmers. Unstable markets for small businesses. We need trade policies that put the people first." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Economy', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "Tulsi Gabbard's campaign website says, \"From the Great Depression through the turn of the 21st Century, Glass-Steagall helped keep our economy safe. Repealing it allowed too-big-to-fail banks to gamble with the savings and livelihoods of the American people, with devastating, irrevocable consequences. Hawai?i, along with communities across the country, paid the price in 2008 with the worst financial crisis since the Great Depression. Today, the banks that were 'too big to fail' in 2008 are even bigger and more powerful now. We must reinstate Glass-Steagall and create a financial system that works for every American—not just Wall Street bank.\" ",
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Education', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Tulsi Gabbard\'s campaign website says, "We need to make sure we are investing in the future of all of our children. In order to invest in our future, we have to provide adequate resources and meaningful accountability to ensure that all our students have equal access to quality education. The cost of tuition keeps too many people from pursuing a college education. We need to resolve student debt and guarantee college for all. From Trump University to Betsy DeVos, members of this administration have put a higher premium on personal enrichment than they have on improving our education." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Gun regulation',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Tulsi Gabbard\'s campaign website says, "The time for action is now. We cannot allow partisan politics to get in the way of taking meaningful action in areas where both parties agree and that have the support of most Americans across this country. Here are a few examples: Both Democrats and Republicans support legislation I have co-sponsored to ban bump stocks. Both Democrats and Republicans support legislation to uphold Second Amendment rights and strengthen the National Instant Criminal Background Check System. Now is the time for us to come together and to take meaningful action towards responsible, common sense gun safety reform." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Criminal justice',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Tulsi Gabbard\'s campaign website says, "Criminal justice reform is a bipartisan issue. We can bring down costs and improve outcomes by implementing alternatives to incarceration. Our outdated policies on marijuana are turning everyday Americans into criminals, tearing apart families, and wasting huge amounts of taxpayer dollars to arrest, prosecute, and incarcerate people for non-violent marijuana charges. We must stand up against for-profit, private prisons and a criminal justice system that favors the rich and powerful and punishes the poor, locking up people who smoke marijuana and ignoring corps like Purdue Pharma responsible for thousands of opioid-related deaths. As president I’ll end the failed war on drugs, legalize marijuana, end cash bail, and ban private prisons and bring about real criminal justice reform." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Foreign policy',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Tulsi Gabbard\'s campaign website says, "As president, I will lead this country to bring about a bold change in our foreign policy that bends the arc of history away from war and towards peace. That stops wasting our resources, and our lives on regime change wars, and redirects our focus and energy towards peace and prosperity for all people. The time is now to give up the gunboat diplomacy of the past, and instead, work out our differences with communication, negotiations, and goodwill." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Impeachment', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Tulsi Gabbard said in a statement, "Up to this point, I have been opposed to pursuing impeachment because it will further divide our already badly divided country. However, after looking carefully at the transcript of the conversation with Ukraine’s President, the whistleblower complaint, the Inspector General memo, and President Trump’s comments about the issue, unfortunately, I believe that if we do not proceed with the inquiry, it will set a very dangerous precedent." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Tulsi_Gabbard_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '0Svhbwro45axGDrQTk6lC',
      type: 'Entry',
      createdAt: '2020-02-15T01:50:41.937Z',
      updatedAt: '2020-03-19T14:58:57.974Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'presidentialCandidate',
        },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Joe Biden',
      website: 'https://joebiden.com/',
      facebook: 'https://www.facebook.com/joebiden',
      twitter: 'https://www.twitter.com/joebiden',
      info: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The following policy positions were compiled by ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'Ballotpedia',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  " from the candidate's official campaign website, editorials, speeches, and interviews.",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Immigration', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Joe Biden\'s campaign website says he wants to pursue a "humane immigration policy that upholds our values, strengthens our economy, and secures our border."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'His campaign website continues, "It’s no secret that our immigration system is broken, and for years, we have lacked the political will to fix it. We can secure our border and enforce our laws without tossing aside our values, our principles, and our humanity. Putting people in cages and tearing children away from their parents isn’t the answer. We have got to address the root causes of migration that push people to leave behind their homes and everything they know to undertake a dangerous journey for the chance at a better life, work that Vice President Biden led in the Obama-Biden Administration. At the same time, we must never forget that immigration is the reason the United States has been able to constantly renew and reinvent itself–legal immigration is an incredible source of strength for our country." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Healthcare', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Joe Biden proposes protecting and building on the Affordable Care Act instead of switching to a Medicare for All system.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'His campaign website says about healthcare: "As president, Biden will stop this reversal of the progress made by Obamacare. And he won’t stop there. He’ll also build on the Affordable Care Act with a plan to insure more than an estimated 97% of Americans. Here’s how: Giving Americans a new choice, a public health insurance option like Medicare. Increasing the value of tax credits to lower premiums and extend coverage to more working Americans. Expanding coverage to low-income Americans. All Americans will have a new, more affordable option. Middle class families will get a premium tax credit to help them pay for coverage. Premium tax credits will be calculated to help more families afford better coverage with lower deductibles. Stop “surprise billing.” Tackle market concentration across our health care system. Lower costs and improve health outcomes by partnering with the health care workforce. Repealing the outrageous exception allowing drug corporations to avoid negotiating with Medicare over drug prices. Limiting launch prices for drugs that face no competition and are being abusively priced by manufacturers. Limiting price increases for all brand, biotech, and abusively priced generic drugs to inflation. Allowing consumers to buy prescription drugs from other countries. Terminating pharmaceutical corporations’ tax break for advertisement spending. Improving the supply of quality generics. Expanding access to contraception and protect the constitutional right to an abortion. Reducing our unacceptably high maternal mortality rate, which especially impacts people of color. Defending health care protections for all, regardless of gender, gender identity, or sexual orientation. Achieving mental health parity and expanding access to mental health care." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Energy and environmental issues',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Joe Biden says he "will lead the world to address the climate emergency and lead through the power of example, by ensuring the U.S. achieves a 100% clean energy economy and net-zero emissions no later than 2050."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Biden\'s campaign website lists the following five pillars to his Clean Energy Revolution plan: "Ensure the U.S. achieves a 100% clean energy economy and reaches net-zero emissions no later than 2050. Build a stronger, more resilient nation. On day one, Biden will make smart infrastructure investments to rebuild the nation and to ensure that our buildings, water, transportation, and energy infrastructure can withstand the impacts of climate change. Rally the rest of the world to meet the threat of climate change. Stand up to the abuse of power by polluters who disproportionately harm communities of color and low-income communities. Fulfill our obligation to workers and communities who powered our industrial revolution and subsequent decades of economic growth." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Trade', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Joe Biden\'s campaign website says, "First and foremost, we must enforce existing trade laws and invest in the competitiveness of our workers and communities here at home, so that they compete on a level playing field. Then, we need to write the rules of the road for international trade through a modern, inclusive process—rules that protect our workers, safeguard the environment, uphold labor standards and middle-class wages, foster innovation, and take on big global challenges like corporate concentration, corruption, and climate change. If we don’t, other countries will write the rules for us."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'His website also says, "We can no longer separate trade policy from our climate objectives. Biden will not allow other nations, including China, to game the system by becoming destination economies for polluters, undermining our climate efforts and exploiting American workers and businesses." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Economy', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Joe Biden\'s campaign website says, "The American middle class built this country. Yet today, CEOs and Wall Street are putting profits over workers, plain and simple. It’s wrong. There used to be a basic bargain in this country that when you work hard, you were able to share in the prosperity your work helped create. It’s time to restore the dignity of work and give workers back the power to earn what they’re worth."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Biden\'s campaign website lists five major policies on American workers: "It’s well past time that we increase the federal minimum wage to $15. We should stop companies from classifying low wage workers as managers in order to avoid paying them the overtime they’ve earned. We have to stop Republican attempts to strip away workers’ rights to form unions and collectively bargain. We also have to stand up against wage suppression through non-compete clauses. And, we need to put an end to unnecessary occupational licensing requirements." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Education', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Joe Biden\'s campaign website says he supports "a plan that provides educators the support and respect they need and deserve, and invests in all children from birth, so that regardless of their zip code, parents’ income, race, or disability, they are prepared to succeed in tomorrow’s economy."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  '"As president, Biden will: Support our educators by giving them the pay and dignity they deserve. Invest in resources for our schools so students grow into physically and emotionally healthy adults, and educators can focus on teaching. Ensure that no child’s future is determined by their zip code, parents’ income, race, or disability. Provide every middle and high school student a path to a successful career. Start investing in our children at birth" ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Gun regulation',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Joe Biden\'s campaign website says, "As president, Biden will pursue constitutional, common-sense gun safety policies. Biden will: Hold gun manufacturers accountable. Ban the manufacture and sale of assault weapons and high-capacity magazines. Buy back the assault weapons and high-capacity magazines already in our communities. Reduce stockpiling of weapons. Require background checks for all gun sales. Create an effective program to ensure individuals who become prohibited from possessing firearms relinquish their weapons. Give states incentives to set up gun licensing programs."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Biden\'s campaign website also says he will, "Establish a new Task Force on Online Harassment and Abuse to focus on the connection between mass shootings, online harassment, extremism, and violence against women. Put America on the path to ensuring that 100% of firearms sold in America are smart guns. Prioritize prosecution of straw purchasers. Dedicate the brightest scientific minds to solving the gun violence public health epidemic. Prohibit the use of federal funds to arm or train educators to discharge firearms. Address the epidemic of suicides by firearms." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Criminal justice',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Joe Biden says he "will strengthen America’s commitment to justice and reform our criminal justice system."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Biden\'s campaign website listed the following core principles of his plan: "We can and must reduce the number of people incarcerated in this country while also reducing crime. No one should be incarcerated for drug use alone. Instead, they should be diverted to drug courts and treatment. Reducing the number of incarcerated individuals will reduce federal spending on incarceration. These savings should be reinvested in the communities impacted by mass incarceration. Our criminal justice system cannot be just unless we root out the racial, gender, and income-based disparities in the system. Black mothers and fathers should feel confident that their children are safe walking the streets of America. And, when a police officer pins on that shield and walks out the door, the officer’s family should know they’ll come home at the end of the day. Additionally, women and children are uniquely impacted by the criminal justice system, and the system needs to address their unique needs. Our criminal justice system must be focused on redemption and rehabilitation. Making sure formerly incarcerated individuals have the opportunity to be productive members of our society is not only the right thing to do, it will also grow our economy. No one should be profiteering off of our criminal justice system." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Foreign policy',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Joe Biden says that the United States "must lead not just with the example of power, but the power of our example."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'He listed the following foreign policy prioirities on his campaign website: "Defend our Vital Interests: As president, Biden will never hesitate to protect the American people, including when necessary, by using force. We have the strongest military in the world—and as president, Biden will ensure it stays that way. End Forever Wars: Biden will end the forever wars in Afghanistan and the Middle East, which have cost us untold blood and treasure. Elevate Diplomacy: As president, Biden will elevate diplomacy as the premier tool of our global engagement. He will rebuild a modern, agile U.S. Department of State—investing in and re-empowering the finest diplomatic corps in the world and leveraging the full talent and richness of America’s diversity. Restore and Reimagine Partnerships: A Biden administration will do more than restore our historic partnerships; it will lead the effort to reimagine them for the future. Renew our Commitment to Arms Control for a New Era Rally the World to Address the Existential Climate Crisis: The Biden administration will rejoin the Paris Climate Accord on day one and lead a major diplomatic push to raise the ambitions of countries’ climate targets." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Impeachment', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Biden called for President Donald Trump\'s impeachment at a town hall event in New Hampshire, saying, "To preserve our Constitution, our democracy, our basic integrity, he should be impeached." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Joe_Biden_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: '5GU7Z3jkZtlc9DW1MpWrkn',
      type: 'Entry',
      createdAt: '2020-02-15T01:58:33.468Z',
      updatedAt: '2020-03-19T14:58:52.493Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'presidentialCandidate',
        },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Donald Trump',
      website: 'https://www.donaldjtrump.com/',
      facebook: 'https://www.facebook.com/DonaldTrump/',
      twitter: 'https://www.twitter.com/realDonaldTrump',
      info: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The following policy positions were compiled by ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'Ballotpedia',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  " from the candidate's official campaign website, editorials, speeches, and interviews.",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Immigration', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Donald Trump\'s campaign website says that "President Trump enforced immigration laws to protect American communities and American jobs. President Trump protects American communities and restores law and order so Americans can feel safe in their communities."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The website says: "President Trump called on Congress to fully fund a wall along the Southern border, to close legal loopholes that enable illegal immigration, to end chain migration, and to eliminate the visa lottery program. From President Trump’s inauguration through the end of FY 2017, U.S. Immigration and Customs Enforcement (ICE) made 110,568 arrests of illegal aliens, a 40 percent increase compared to the same time period the prior year. The number of counties participating in the 287(g) program, which gives state and local law enforcement entities delegated authority by ICE to enforce immigration in their jurisdiction, has doubled." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Healthcare', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Donald Trump\'s campaign website says that during his first term, Trump has worked on "providing Americans the healthcare they need" and "improving access to affordable, quality healthcare".',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The website says: "The Department of Agriculture provided more than $1 billion in fiscal year 2017 to be used to improve access to health care services for 2.5 million people in rural communities. President Trump mobilized his entire Administration to address drug addiction and opioid abuse by directing the declaration of a Nationwide Public Health Emergency. President Trump signed an Executive order to reform the United States healthcare system to take the first steps to expand choices and alternatives to Obamacare plans and increase competition to bring down costs for consumers. Under President Trump, The FDA has approved the most number of generic drugs in history in order to increase competition in the marketplace and lower the cost of prescription drugs for all Americans." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Energy and environmental issues',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "Donald Trump's campaign website says that \"President Trump is reversing years of policies that locked-up American energy and restricted our ability to sell to other countries. Following the principles established by the President’s Executive Order on Energy Independence, EPA has proposed the repeal of the 'Clean Power Plan.' EPA Administrator Pruitt launched a task force to provide recommendations on how to streamline and improve the Superfund program, which is responsible for cleaning up land contaminated by hazardous waste. EPA has re-launched launched the Smart Sectors Program to partner with the private sector to achieve better environmental outcomes.\"",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The website says: "President Trump signed an Executive Order to expand offshore oil and gas drilling and open more leases to develop offshore drilling. President Trump directed the Environmental Protection Agency (EPA) to rescind the Obama Administration’s Clean Power Plan (CPP). The Administration estimates that repealing the Clean Power Plan could eliminate up to $33 billion in compliance costs in 2030. In May 2017, EPA Administrator Pruitt announced the creation of a Superfund task force to look at ways to streamline and improve the Superfund program." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Trade', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Donald Trump\'s campaign website says that, "Since taking office, President Trump has advanced free, fair and reciprocal trade deals that protect American workers, ending decades of destructive trade policies."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The website says: "One of President Trump’s first actions was to withdraw the United States from the Trans-Pacific Partnership, advancing his agenda to protect American workers. Since taking office, President Trump has sought to confront unfair trade practices that have harmed American commerce for far too long. The Trump Administration successfully litigated WTO disputes targeting unfair trade practices and protected our right to enact fair trade laws." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Economy', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Donald Trump\'s campaign website says that "President Trump put the American economy into high gear, which created jobs and increased wealth."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The website says: "Under President Trump’s leadership, Congress passed historic tax cuts and relief for hard-working Americans. The U.S. Gross Domestic Product (GDP) grew at or above 3 percent for two quarters in a row for the first time in three years. During his first year, nearly 3 million new jobs were created since January 2017 and the unemployment rate fell to 3.8 percent, the first time below 4% in 18 years. The Dow Jones Industrial Average hit record highs more than 80 times under President Trump, including closing higher than 26,000 points for the first time in its history. Economic confidence rebounded to record highs under President Trump because his pro-growth policies have and continue to put American workers and businesses first." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Education', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Donald Trump\'s campaign website says that "President Donald J. Trump and his Administration have supported expanding school choice across the country so parents have a voice in their children’s education. President Trump and his Administration have identified and begun to end harmful regulations while maintaining protections for students."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The website says "The Department of Education has overseen the first year of the Every Student Succeeds Act (ESSA) to empower States with the flexibility they need to educate their students. President Trump and his Administration are taking steps to reform the student aid process. The Department of Education is working to ensure regulations on the books adequately protect students while giving States, institutions, teachers, parents and students the flexibility they need to improve outcomes." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Gun regulation',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Donald Trump\'s campaign website says that under his administration, "Prosecutors were directed by the Department of Justice to focus on taking illegal guns off our streets. Criminals charged with unlawful possession of a firearm has increased 23 percent." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Criminal justice',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Donald Trump\'s campaign website says that "President Donald J. Trump and the Department of Justice are working with local law enforcement to protect American communities. President Trump’s Administration is protecting the rights of all Americans. President Trump and the Department of Justice have aggressively confronted organized crime from street gangs to criminal cartels."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The website says, "President Trump signed Executive Order 13809 to restore State and local law enforcement’s access to surplus equipment from the Defense Department, such as armored vehicles. Attorney General Sessions returned to longstanding Department of Justice charging policy for our Federal prosecutors, trusting them once again and directing them to return to charging the most serious, readily provable offense. Under President Trump, the Department of Justice has supported students whose free-speech rights have been under attack on university campuses. Attorney General Sessions designated MS-13 as a priority for the Organized Crime Drug Enforcement Task Force, to allow Federal law enforcement to utilize an expanded toolkit in its efforts to dismantle the organization." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Foreign policy',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Donald Trump\'s campaign website says that "President Trump put America first in trade so American workers aren’t put at a disadvantage. President Trump has used an America First foreign policy to restore respect for the United States throughout the world and to advance our interests. President Trump has made historic trips and delivered speeches abroad restoring America’s influence around the world. President Trump is rebuilding our military, defeating terrorist organizations, and confronting rogue nations to protect America and our allies. President Donald J. Trump announced additional measures to punish those who seek to undermine American democracy and security."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'The website says, "President Trump traveled to the Middle East and Europe to solidify relations with our allies in both regions and to push for greater commitments and cooperation. President Trump is putting maximum pressure on North Korea to denuclearize. President Trump is confronting Iran’s aggression." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Impeachment', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'In a statement before the press, Donald Trump said, "And the witch hunt continues, but they’re getting hit hard in this witch hunt, because when they look at the information, it’s a joke. Impeachment? For that? When you have a wonderful meeting, or you have a wonderful phone conversation?" ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Donald_Trump_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: 'yeK1MF1C63og75HNR0M5N',
      type: 'Entry',
      createdAt: '2020-02-15T01:22:02.294Z',
      updatedAt: '2020-03-19T14:58:21.790Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 4,
      contentType: {
        sys: {
          type: 'Link',
          linkType: 'ContentType',
          id: 'presidentialCandidate',
        },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Bernie Sanders',
      website: 'https://berniesanders.com/',
      facebook: 'https://www.facebook.com/berniesanders/',
      twitter: 'https://www.twitter.com/berniesanders',
      info: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The following policy positions were compiled by ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  {
                    data: {},
                    marks: [],
                    value: 'Ballotpedia',
                    nodeType: 'text',
                  },
                ],
                nodeType: 'hyperlink',
              },
              {
                data: {},
                marks: [],
                value:
                  " from the candidate's official campaign website, editorials, speeches, and interviews.",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Immigration', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders supports creating a pathway to citizenship, providing legal status to DACA-eligible immigrants, and restructuring the Immigration and Customs Enforcement agency.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Sanders\' campaign website proposes the following. "Enact comprehensive immigration reform, including a path towards citizenship. Expand DACA and DAPA, including providing immediate legal status for young people eligible for the DACA program and developing a humane policy for those seeking asylum. Completely reshape and reform our immigration enforcement system, including fundamentally restructuring ICE, an agency Senator Sanders voted against creating. End the barbaric practice of family separation and detention of children in cages. Dismantle cruel and inhumane deportation programs and detention centers. Establish standards for independent oversight of relevant agencies within DHS." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Healthcare', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders campaign website says he supports "guaranteeing health care to all people as a right, not a privilege, through a Medicare-for-all, single-payer program."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Sanders\' campaign website also says, "Today, more than 30 million Americans still don’t have health insurance and even more are underinsured. Even for those with insurance, costs are so high that medical bills are the number one cause of bankruptcy in the United States. Incredibly, we spend significantly more of our national GDP on this inadequate health care system—far more per person than any other major country. And despite doing so, Americans have worse health outcomes and a higher infant mortality rate than countries that spend much less on health care. Our people deserve better. We should be spending money on doctors, nurses, mental health specialists, dentists, and other professionals who provide services to people and improve their lives. We must invest in the development of new drugs and technologies that cure disease and alleviate pain—not wasting hundreds of billions of dollars a year on profiteering, huge executive compensation packages, and outrageous administrative costs. The giant pharmaceutical and health insurance lobbies have spent billions of dollars over the past decades to ensure that their profits come before the health of the American people. We must defeat them, together." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Energy and environmental issues',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders says the climate crisis is "the single greatest challenge facing our country" and supports implementing the Green New Deal.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Sanders\' campaign website states the following priorities: "Reaching 100 percent renewable energy for electricity and transportation by no later than 2030 and complete decarbonization by 2050 at latest. Ending unemployment by creating 20 million jobs needed to solve the climate crisis. Directly invest an historic $16.3 trillion public investment toward these efforts. A just transition for workers. Declaring climate change a national emergency. Saving American families money by weatherizing homes and lowering energy bills, building affordable and high-quality, modern public transportation, providing grants and trade-in programs for families and small businesses to purchase high-efficiency electric vehicles, and rebuilding our inefficient and crumbling infrastructure, including deploying universal, affordable high-speed internet. Supporting small family farms by investing in ecologically regenerative and sustainable agriculture. Justice for frontline communities. Commit to reducing emissions throughout the world. Meeting and exceeding our fair share of global emissions reductions. Making massive investments in research and development. Expanding the climate justice movement. Investing in conservation and public lands to heal our soils, forests, and prairie lands. This plan will pay for itself over 15 years. We will pay for the massive investment we need to reverse the climate crisis by: Making the fossil fuel industry pay for their pollution, through litigation, fees, and taxes, and eliminating federal fossil fuel subsidies. Generating revenue from the wholesale of energy produced by the regional Power Marketing Authorities. Scaling back military spending on maintaining global oil dependence. Collecting new income tax revenue from the 20 million new jobs created by the plan. Reduced need for federal and state safety net spending due to the creation of millions of good-paying, unionized jobs. Making the wealthy and large corporations pay their fair share." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Trade', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders\' campaign website says "We need a new trade policy that creates decent-paying jobs in America and ends the race to the bottom. Corporate America cannot continue to throw American workers out on the street while they outsource our jobs and enjoy record-breaking profits. Despite the president’s tough rhetoric and haphazard tariffs, under Trump, we now have a record-breaking $890 billion annual trade deficit in goods. And since Trump was elected, multinational corporations have shipped 185,000 American jobs overseas. That is unacceptable."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'His campaign website goes on: "As part of a new trade policy, we must: Eliminate the incentives baked into our current trade and tax agreements that make it easier for multinational corporations to ship jobs overseas. Corporations should not be able to get a tax deduction for the expenses involved in moving their factories abroad and throwing American workers out on the street. Instead of providing federal tax breaks, contracts, grants, and loans to corporations that outsource jobs, we need to support the small businesses that are creating good jobs in America. We must also expand “Buy American,” “Buy Local,” and other government policies that will increase jobs in the U.S. We need to make sure that strong and binding labor, environmental, and human rights standards are written into the core text of all trade agreements. We must also add to the core text of every U.S. trade agreement, enforceable rules against currency cheating, which allows countries to unfairly dump their products in this country and makes our exports more expensive abroad. Our trade policies must support communities of color that have been impacted the worst by our unfair trade deals. Undo the harm that trade agreements have done to family farmers. We must eliminate rules in our trade deals that increase the cost of medicines." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Economy', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders\' campaign website says, "While the Bill of Rights protects us from the tyranny of an oppressive government, many in the establishment would like the American people to submit to the tyranny of oligarchs, multinational corporations, Wall Street banks, and billionaires who now control almost every aspect of our daily lives. But as President Franklin Roosevelt said 75 years ago: “True individual freedom cannot exist without economic security.”',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'His campaign website calls for a 21st Century Economic Bill of Rights with the following guarantees: "The right to a job that pays a living wage. The right to quality health care. The right to a complete education. The right to affordable housing. The right to a clean environment. The right to a secure retirement." His campaign website also lists the following priorities on Real Wall Street Reform: "Break up too-big-to-fail banks. End the too-big-to-jail doctrine. Reinstate the Glass-Steagall Act. Cap credit card interest rates. Allow every post office to offer basic and affordable banking services. Cap ATM fees. Audit the Federal Reserve and make it a more democratic institution so that it becomes responsive to the needs of ordinary Americans, not just the billionaires on Wall Street. Restrict rapid-fire financial speculation with a financial transactions tax. Reform credit rating agencies." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Education', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders supports increasing funding for public education and opposes for-profit charter schools.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "Sanders' campaign website proposes the following: \"We must make sure that charter schools are accountable, transparent and truly serve the needs of disadvantaged children, not Wall Street, billionaire investors, and other private interests. We must ensure that a handful of billionaires don’t determine education policy for our nation’s children. We will oppose the DeVos-style privatization of our nation’s schools and will not allow public resources to be drained from public schools. We must guarantee childcare and universal pre-Kindergarten for every child in America to help level the playing field, create new and good jobs, and enable parents more easily balance the demands of work and home. We must increase pay for public school teachers so that their salary is commensurate with their importance to society. And we must invest in high-quality, ongoing professional development, and cancel teachers’ student debt. We must protect the tenure system for public school teachers and combat attacks on collective bargaining by corporate profiteers. We must put an end to high-stakes testing and 'teaching to the test' so that our students have a more fulfilling educational life and our teachers are afforded professional respect. We must guarantee children with disabilities an equal right to high-quality education, and increase funding for programs that combat racial segregation and unfair disciplinary practices that disproportionately affect students of color.\" ",
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Gun regulation',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders supports expanding background checks, banning the sale of certain firearms, and prohibiting high-capacity ammunition magazines.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "Sanders' campaign website says, \"We must: Take on the NRA and its corrupting effect on Washington. The NRA has become a partisan lobbying public-relations entity for gun manufacturers, and its influence must be stopped. Expand background checks. End the gun show loophole. All gun purchases should be subject to the same background check standards. Ban the sale and distribution of assault weapons. Assault weapons are designed and sold as tools of war. There is absolutely no reason why these firearms should be sold to civilians. Prohibit high-capacity ammunition magazines. Crack down on 'straw purchases' where people buy guns for criminals.\" ",
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Criminal justice',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders campaign website says, "We are going to end the international embarrassment of having more people in jail than any other country on earth. Instead of spending $80 billion a year on jails and incarceration, we are going to invest in jobs and education for our young people. No more private prisons and detention centers. No more profiteering from locking people up. No more \'war on drugs.\' No more keeping people in jail because they’re too poor to afford cash bail."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Sanders\' campaign website contains the following main tenets of his criminal justice reform plan: "End Profiteering in Our Criminal Justice System. End Cash Bail. Transform the Way We Police Communities. Ensure Law Enforcement Accountability and Robust Oversight. Provide More Support to Police Officers and Create A Robust Non-Law Enforcement Alternative Response System. Ensuring All Americans Due Process. Right to counsel. Ensure Accountability and Fairness in Prosecution. Ending Mass Incarceration and Excessive Sentencing. End the War on Drugs and Stop Criminalizing Addiction. Treat Children Like Children. Reform Our Decrepit Prison System to Make Jails and Prisons More Humane. Ensure a Just Transition Post-Release. Stop The Cycle of Violence by Prioritizing the Most Serious Offenses. Provide Adequate Support to Crime Survivors. Reverse the Criminalization of Disability. Investing in Community Living. Investing in Our Communities." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Foreign policy',
                nodeType: 'text',
              },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders campaign website says, "The U.S. must lead the world in improving international cooperation in the fight against climate change, militarism, authoritarianism, and global inequality."',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'His website says that he will: "Implement a foreign policy which focuses on democracy, human rights, diplomacy and peace, and economic fairness. Allow Congress to reassert its Constitutional role in warmaking, so that no president can wage unauthorized and unconstitutional interventions overseas. Follow the American people, who do not want endless war. American troops have been in Afghanistan for nearly 18 years, the longest war in American history. Our troops have been in Iraq since 2003, and in Syria since 2015, and many other places. It is long past time for Congress to reassert its Constitutional authority over the use of force to responsibly end these interventions and bring our troops home. End U.S. support for the Saudi-led intervention in Yemen, which has created the world’s worst humanitarian catastrophe. Rejoin the Iran nuclear agreement and talk to Iran on a range of other issues. Work with pro-democracy forces around the world to build societies that work for and protect all people. In the United States, Europe, and elsewhere, democracy is under threat by forces of intolerance, corruption, and authoritarianism." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              { data: {}, marks: [], value: 'Impeachment', nodeType: 'text' },
            ],
            nodeType: 'heading-3',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Bernie Sanders said in a statement, "Three months ago, I called for an impeachment inquiry by the Judiciary Committee of the U.S. House of Representatives into the actions and behavior of President Trump. I believed then and I believe now that in Donald Trump we have the most corrupt president in the modern history of this country." ',
                nodeType: 'text',
              },
              {
                data: {
                  uri:
                    'https://ballotpedia.org/Bernie_Sanders_presidential_campaign,_2020',
                },
                content: [
                  { data: {}, marks: [], value: '[source]', nodeType: 'text' },
                ],
                nodeType: 'hyperlink',
              },
              { data: {}, marks: [], value: '', nodeType: 'text' },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: 'ZzJ4NeBoAVFahkcp5VltL',
      type: 'Entry',
      createdAt: '2019-11-10T01:19:42.463Z',
      updatedAt: '2020-02-04T19:23:16.056Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 42,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'homepage' },
      },
      locale: 'en-US',
    },
    fields: {
      title: 'Home Page',
      topLogo: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '3ck2MrIB4DUsfuEC0exrHr',
          type: 'Asset',
          createdAt: '2019-11-10T00:14:21.777Z',
          updatedAt: '2019-11-10T00:14:21.777Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'The Good Party Logo',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/3ck2MrIB4DUsfuEC0exrHr/0ccdf2c914950ba9b3d2e41c05aed893/image04.svg',
            details: { size: 2829, image: { width: 1600, height: 500 } },
            fileName: 'image04.svg',
            contentType: 'image/svg+xml',
          },
        },
      },
      topDescription: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Power and money have corrupted both major U.S. Political parties.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: "We're working on a truly ",
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }, { type: 'italic' }],
                value: 'Good ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'alternative!',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
      blueSectionMainTitle: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Imagine if your vote could be ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'underline' }],
                value: 'guaranteed',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value: ' to get you...',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
      blueSectionBox1Image: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '5Rfj24mD8Yjhd2cVIsRC4b',
          type: 'Asset',
          createdAt: '2019-11-10T22:00:14.372Z',
          updatedAt: '2019-11-10T22:00:25.600Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          locale: 'en-US',
        },
        fields: {
          title: 'AN HONEST REPRESENTATIVE',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/5Rfj24mD8Yjhd2cVIsRC4b/2317649f78a480cae8127fe7be4bd5b0/image01.svg',
            details: { size: 7915, image: { width: 300, height: 300 } },
            fileName: 'image01.svg',
            contentType: 'image/svg+xml',
          },
        },
      },
      blueSectionBox1Subtitle: 'HONEST REPRESENTATIVES',
      blueSectionBox1Content: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  'Fresh, independent citizen candidates, vowing to openly represent us and our Good Platform, rather than partisan career politicians working for their big money backers.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
      blueSectionBox2Image: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '38ULTkHJqkmOpWb9cmOfMF',
          type: 'Asset',
          createdAt: '2019-11-10T22:44:42.338Z',
          updatedAt: '2019-11-10T22:44:42.338Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'image05',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/38ULTkHJqkmOpWb9cmOfMF/405e589da274285d6c4334189058ce22/image05.svg',
            details: { size: 5968, image: { width: 300, height: 300 } },
            fileName: 'image05.svg',
            contentType: 'image/svg+xml',
          },
        },
      },
      blueSectionBox2Subtitle: 'OPEN ACCOUNTABILITY',
      blueSectionBox2Content: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "A public calendar and live video stream all your representative’s meetings with a closed-captioned, searchable archive. So you'll know every action taken in your name.",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
      blueSectionBox3Image: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '5Ve4Ild3zJ33ZnWGloZRLI',
          type: 'Asset',
          createdAt: '2019-11-10T22:45:36.133Z',
          updatedAt: '2019-11-10T22:45:36.133Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'image02',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/5Ve4Ild3zJ33ZnWGloZRLI/7becd6f2c661161276459650a85833c5/image02.svg',
            details: { size: 12903, image: { width: 300, height: 300 } },
            fileName: 'image02.svg',
            contentType: 'image/svg+xml',
          },
        },
      },
      blueSectionBox3Subtitle: 'A GOOD PLATFORM',
      blueSectionBox3Content: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'Prioritizing the ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'People',
                nodeType: 'text',
              },
              { data: {}, marks: [], value: ', our ', nodeType: 'text' },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Planet',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value: ' and sustainable ',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Peace ',
                nodeType: 'text',
              },
              { data: {}, marks: [], value: 'and', nodeType: 'text' },
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: ' Prosperity',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  ' for all -- instead of a short-sighted agenda set by corporate lobbyists or special interests of the 1%.',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
      blueSectionBox4Image: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '23RB0UtxItFpYZlkiWQGXG',
          type: 'Asset',
          createdAt: '2019-11-10T22:46:50.376Z',
          updatedAt: '2019-11-10T22:46:50.376Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 1,
          locale: 'en-US',
        },
        fields: {
          title: 'image03',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/23RB0UtxItFpYZlkiWQGXG/dd4d98f3063cc25ce315302db50ae736/image03.svg',
            details: { size: 6303, image: { width: 300, height: 300 } },
            fileName: 'image03.svg',
            contentType: 'image/svg+xml',
          },
        },
      },
      blueSectionBox4Subtitle: 'No Wasted Votes',
      blueSectionBox4Content: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value:
                  "Efficiency, so we don't need your money, won't take much time",
                nodeType: 'text',
              },
              {
                data: {},
                marks: [{ type: 'underline' }],
                value: ',',
                nodeType: 'text',
              },
              { data: {}, marks: [], value: ' and ', nodeType: 'text' },
              {
                data: {},
                marks: [{ type: 'underline' }],
                value: 'never, ever waste a single vote!',
                nodeType: 'text',
              },
              {
                data: {},
                marks: [],
                value:
                  "  (You'll only be asked to vote for a Good Party Certified candidate, if we have enough support to guarantee a win!)",
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
      redSectionTitle: 'Interested? Get Involved!',
      redSectionContent: {
        data: {},
        content: [
          {
            data: {},
            content: [
              {
                data: {},
                marks: [],
                value: 'The Good Party is looking for a few Good People: ',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value: 'Technologists (mobile & back-end) ',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value: 'Data Driven Marketers ',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value: 'Political Strategists ',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
              {
                data: {},
                content: [
                  {
                    data: {},
                    content: [
                      {
                        data: {},
                        marks: [],
                        value: 'Activists and Organizers ',
                        nodeType: 'text',
                      },
                    ],
                    nodeType: 'paragraph',
                  },
                ],
                nodeType: 'list-item',
              },
            ],
            nodeType: 'unordered-list',
          },
          {
            data: {},
            content: [
              {
                data: {},
                marks: [{ type: 'bold' }],
                value: 'Can you help? Apply below...',
                nodeType: 'text',
              },
            ],
            nodeType: 'paragraph',
          },
          {
            data: {},
            content: [{ data: {}, marks: [], value: '', nodeType: 'text' }],
            nodeType: 'paragraph',
          },
        ],
        nodeType: 'document',
      },
      formSectionTitle: 'Get in Touch',
      formSectionSubtitle:
        'Apply to join our team or to let us know what you think!',
    },
  },
  {
    sys: {
      space: { sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' } },
      id: 'uBa1kXny8v3NzSusxBzcj',
      type: 'Entry',
      createdAt: '2019-12-02T04:54:42.247Z',
      updatedAt: '2019-12-02T19:54:49.035Z',
      environment: {
        sys: { id: 'master', type: 'Link', linkType: 'Environment' },
      },
      revision: 2,
      contentType: {
        sys: { type: 'Link', linkType: 'ContentType', id: 'person' },
      },
      locale: 'en-US',
    },
    fields: {
      name: 'Farhad Mohit',
      title: 'Founder, The Good Party',
      avatarPhoto: {
        sys: {
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'g08ybc4r0f4b' },
          },
          id: '7JFCpApSXrygLTODRTW6NQ',
          type: 'Asset',
          createdAt: '2019-12-02T04:53:00.374Z',
          updatedAt: '2020-03-21T07:12:07.569Z',
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          revision: 2,
          locale: 'en-US',
        },
        fields: {
          title: 'Farhad',
          file: {
            url:
              '//images.ctfassets.net/g08ybc4r0f4b/7JFCpApSXrygLTODRTW6NQ/a66257b4dec68db9894ff9c6e7a7829c/053_LK1_2704.jpg',
            details: { size: 47289, image: { width: 216, height: 216 } },
            fileName: '053_LK1_2704.jpg',
            contentType: 'image/jpeg',
          },
        },
      },
    },
  },
];
