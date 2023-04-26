const { Consumer } = require('sqs-consumer');
const AWS = require('aws-sdk');
const https = require('https');

const { Configuration, OpenAIApi } = require('openai');
const CampaignPlanVersion = require('../../models/campaign/CampaignPlanVersion');
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
    case 'generateCampaignPlan':
      await handleGenerateCampaignPlan(data);
      break;
  }
}

async function handleGenerateCampaignPlan(message) {
  try {
    await sails.helpers.errorLoggerHelper(
      'handling campaign from queue',
      message,
    );
    const { prompt, slug, subSectionKey, key, existingChat } = message;
    let chat = existingChat || [];
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      max_tokens: existingChat && existingChat.length > 0 ? 2000 : 2500,
      messages: [{ role: 'user', content: prompt }, ...chat],
    });
    chatResponse = completion.data.choices[0].message.content.replace(
      '/n',
      '<br/><br/>',
    );

    const campaign = await Campaign.findOne({ slug });
    const { data } = campaign;
    await sails.helpers.ai.saveCampaignVersion(
      data,
      subSectionKey,
      key,
      campaign.id,
    );

    data[subSectionKey][key] = chatResponse;
    if (
      !data.campaignPlanStatus ||
      typeof campaign.campaignPlanStatus === 'string'
    ) {
      data.campaignPlanStatus = {};
    }
    data.campaignPlanStatus[key] = 'completed';
    await Campaign.updateOne({
      slug,
    }).set({
      data,
    });
    await sails.helpers.errorLoggerHelper(
      'updated campaign with ai. chatResponse: ',
      chatResponse,
    );
  } catch (e) {
    console.log('error at consumer', e);
    if (e.data) {
      await sails.helpers.errorLoggerHelper(
        'error at AI queue consumer (with msg): ',
        e.data.error,
      );
      console.log('error', e.data.error);
    } else {
      await sails.helpers.errorLoggerHelper('error at AI queue consumer: ', e);
    }
  }
}

async function saveVersion(data, subSectionKey, key, campaignId) {
  const previousVersion = {
    date: new Date().toString(),
    aiResponse: data[subSectionKey][key],
  };
  if (!previousVersion) {
    return;
  }
  const existingVersions = await CampaignPlanVersion.findOne({
    campaign: campaignId,
  });
  let versions = {};
  if (existingVersions) {
    versions = existingVersions.data;
  }

  if (!versions[key]) {
    versions[key] = [];
  }
  versions[key].push(previousVersion);
  if (existingVersions) {
    await CampaignPlanVersion.updateOne({
      campaign: campaignId,
    }).set({
      data: versions,
    });
  } else {
    await CampaignPlanVersion.create({
      campaign: campaignId,
      data: versions,
    });
  }
}
