const { Consumer } = require('sqs-consumer');
const AWS = require('aws-sdk');
const https = require('https');

const { Configuration, OpenAIApi } = require('openai');
const openAiKey = sails.config.custom.openAi || sails.config.openAi;

const AiConfiguration = new Configuration({
  apiKey: openAiKey,
});
const openai = new OpenAIApi(AiConfiguration);

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;
const queueUrl = sails.config.custom.queueUrl || sails.config.queueUrl;

let queue;
AWS.config.update({
  region: 'eu-west-2',
  accessKeyId,
  secretAccessKey,
});

module.exports = {
  inputs: {},
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    try {
      if (!queueUrl) {
        return exits.success('not ok');
      }
      if (!queue) {
        console.log('no queue instance, creating a new one');
        queue = Consumer.create({
          queueUrl,
          handleMessage: async (message) => {
            await handleMessage(message);
          },
          sqs: new AWS.SQS({
            httpOptions: {
              agent: new https.Agent({
                keepAlive: true,
              }),
            },
          }),
        });
        queue.on('error', (err) => {
          console.error(err.message);
        });

        queue.on('processing_error', (err) => {
          console.error(err.message);
        });

        queue.start();
      }
      return exits.success('ok');
    } catch (e) {
      return exits.success('not ok');
    }
  },
};

async function handleMessage(message) {
  if (!message) {
    return;
  }
  const body = message.Body;
  if (!body) {
    return;
  }
  const action = JSON.parse(body);
  const { type, data } = action;
  console.log('processing queue message type ', type);
  switch (type) {
    // case 'pulsarSearches':
    //   await handlePulsarSearches(data);
    //   break;
    // case 'pulsarFollowers':
    //   await handlePulsarFollowers(data);
    //   break;
    // case 'pulsarBrands':
    //   await handlePulsarBrands(data);
    //   break;
    // case 'candidateTikTokScrape':
    //   await handleCandidateTikTokScrape(data);
    //   break;
    // case 'pulsarCandidateFeed':
    //   await handlePulsarCandidateFeed(data);
    //   break;
    case 'generateCampaignPlan':
      await handleGenerateCampaignPlan(data);
      break;
  }
}

async function handleGenerateCampaignPlan(message) {
  try {
    console.log('handling campaign', message);
    const { prompt, slug, subSectionKey, key, existingChat } = message;
    let chat = existingChat || [];
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      max_tokens: 3000,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful political assistant.',
        },
        { role: 'user', content: prompt },
        ...chat,
      ],
    });
    chatResponse = completion.data.choices[0].message.content.replace(
      '/n',
      '<br/><br/>',
    );

    const campaign = await Campaign.findOne({ slug });
    const { data } = campaign;
    data[subSectionKey][key] = chatResponse;
    data.campaignPlanStatus = 'completed';
    await Campaign.updateOne({
      slug,
    }).set({
      data,
    });
  } catch (e) {
    console.log('error at consumer', e);
    if (e.data) {
      console.log('error', e.data.error);
    }
  }
}
async function handlePulsarSearches(message) {
  try {
    const { page } = message;
    const query = `
       query Searches($limit: Int, $page: Int) {
        searches(limit: $limit, page: $page) {
          total,
          searches {
            searchName,
            realtimeStatus,
            search,
            status
            }
          }
        }
      `;

    const variables = {
      page,
    };

    const data = await sails.helpers.socialListening.pulsarQueryHelper(
      query,
      variables,
      'trac',
    );

    if (data && data.searches && data.searches.searches) {
      const results = data.searches.searches;
      for (let i = 0; i < results.length; i++) {
        const { searchName, realtimeStatus, search, status } = results[i];
        if (realtimeStatus === 'STARTED' && status === 'READY') {
          const name = searchName.split(' ');
          const candidate = await Candidate.findOne({
            firstName: name[0],
            lastName: name[name.length - 1],
          });
          if (candidate) {
            const data = JSON.parse(candidate.data);
            await Candidate.updateOne({ id: candidate.id }).set({
              data: JSON.stringify({
                ...data,
                pulsarSearchId: search,
              }),
            });
          }
        }
      }
    }
  } catch (e) {
    console.log('error at handlePulsarSearches', e);
  }
}

async function handlePulsarFollowers(message) {
  try {
    const { variables, date, id, source, brandRecordId, name } = message;

    const query = `
       query Followers(
          $filter: Filter!
          $metric: StatMetric!
          $benchmark: Benchmark
        ) {
          followers(filter: $filter, metric: $metric, benchmark: $benchmark)
        }
      `;

    const data = await sails.helpers.socialListening.pulsarQueryHelper(
      query,
      variables,
      'core',
    );
    if (data) {
      const record = await SocialStat.findOrCreate(
        {
          socialBrand: brandRecordId,
          profileId: id,
          date,
          channel: source,
          action: 'followers',
        },
        {
          channel: source,
          socialBrand: brandRecordId,
          name,
          profileId: id,
          date,
          action: 'followers',
          count: data.followers,
        },
      );
      await SocialStat.updateOne({
        id: record.id,
      }).set({
        count: data.followers,
      });
    }
  } catch (e) {
    console.log('error at handlePulsarFollowers', e);
  }
}

async function handlePulsarBrands(message) {
  try {
    const { page } = message;
    const query = `
    query BrandsPlusProfiles($page: Int, $limit: Int) {
      brands(page: $page, limit: $limit) {
        total
        nextPage
        brands {
          id
          name
          profiles {
            id
            source
            name
            plugged
          }
        }
      }
    }
  `;
    const variables = {
      page: page,
    };
    const data = await sails.helpers.socialListening.pulsarQueryHelper(
      query,
      variables,
      'core',
    );

    if (data.brands && data.brands.brands) {
      const { brands } = data.brands;
      for (let i = 0; i < brands.length; i++) {
        const { name, id, profiles } = brands[i];
        let candidateId;
        try {
          const nameArr = name.split(' ');
          if (nameArr.length === 2) {
            const candidate = await Candidate.findOne({
              firstName: nameArr[0],
              lastName: nameArr[1],
            });
            if (candidate) {
              // console.log('candidate found', candidate);
              candidateId = candidate.id;
            }
          }
        } catch (e) {
          console.log('error mapping to candidate', e);
        }

        await SocialBrand.findOrCreate(
          { brandId: id },
          {
            name,
            brandId: id,
            profiles,
            candidate: candidateId,
          },
        );
        await SocialBrand.updateOne({ brandId: id }).set({
          name,
          brandId: id,
          profiles,
          candidate: candidateId,
        });
      }
    }
    await sails.helpers.cacheHelper('clear', 'all');
  } catch (e) {
    console.log('Error at handlePulsarBrands', e);
  }
}

async function handleCandidateTikTokScrape(message) {
  try {
    const { tiktok, today, name } = message;

    const scraped = await sails.helpers.socialListening.tiktokScraperHelper(
      tiktok,
    );
    if (scraped) {
      const { followers } = scraped;

      const brand = await SocialBrand.findOne({ name });
      if (brand) {
        const brandId = brand.id;

        await SocialStat.findOrCreate(
          {
            socialBrand: brandId,
            profileId: brandId,
            date: today,
            channel: 'tiktok',
            action: 'followers',
          },
          {
            channel: 'tiktok',
            socialBrand: brandId,
            name,
            profileId: brandId,
            date: today,
            action: 'followers',
            count: followers,
          },
        );

        await SocialStat.updateOne({
          socialBrand: brandId,
          profileId: brandId,
          date: today,
          channel: 'tiktok',
        }).set({
          count: followers,
        });
      }
      await sails.helpers.cacheHelper('clear', 'all');
    }
  } catch (e) {
    console.log('error at handleCandidateTikTokScrape', e);
  }
}

async function handlePulsarCandidateFeed(message) {
  try {
    const { pulsarSearchId } = message;
    await sails.helpers.socialListening.searchResultsHelper(
      pulsarSearchId,
      30,
      true,
      false,
      false,
    );
    await sails.helpers.cacheHelper('clear', 'all');
  } catch (e) {
    console.log('error at handlePulsarCandidateFeed', e);
  }
}
