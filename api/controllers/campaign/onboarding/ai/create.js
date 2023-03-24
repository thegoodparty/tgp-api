/* eslint-disable object-shorthand */
const { Configuration, OpenAIApi } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

const configuration = new Configuration({
  apiKey: openAiKey,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  inputs: {
    key: {
      type: 'string',
      required: true,
    },
    subSectionKey: {
      type: 'string',
      required: true,
    },
    regenerate: {
      type: 'boolean',
    },
    editMode: {
      type: 'boolean',
    },
    chat: {
      type: 'ref',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;
      const { key, subSectionKey, regenerate, editMode, chat } = inputs;
      await sails.helpers.queue.consumer();

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }

      if (!regenerate && campaign.campaignPlanStatus === 'processing') {
        return exits.success({
          status: 'processing',
          step: 'waiting',
        });
      }
      const existing = campaign[subSectionKey] && campaign[subSectionKey][key];

      if (
        !editMode &&
        campaign.campaignPlanStatus === 'completed' &&
        existing
      ) {
        return exits.success({
          status: 'completed',
          chatResponse: campaign[subSectionKey][key],
        });
      }

      // generating a new campaign here
      console.log('creating new queue campaign message');
      if (!campaign[subSectionKey]) {
        campaign[subSectionKey] = {};
      }
      const cmsPrompts = await sails.helpers.ai.getPrompts();
      let prompt = cmsPrompts[key];
      prompt = await sails.helpers.ai.promptReplace(prompt, campaign);
      const queueMessage = {
        type: 'generateCampaignPlan',
        data: {
          slug: campaign.slug,
          prompt,
          subSectionKey,
          key,
          existingChat: chat || [],
        },
      };

      await sails.helpers.queue.enqueue(queueMessage);

      campaign.campaignPlanStatus = 'processing';
      await Campaign.updateOne({
        slug: campaign.slug,
      }).set({
        data: campaign,
      });
      await sails.helpers.queue.consumer();

      return exits.success({
        status: 'processing',
        step: 'created',
      });
    } catch (e) {
      console.log('Error generating AI response', e);
      if (e.data && e.data.error) {
        console.log('*** error*** :', e.data.error);
        return exits.badRequest();
      }
      return exits.badRequest();
    }
  },
};
