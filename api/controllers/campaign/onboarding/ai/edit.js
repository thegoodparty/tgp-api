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
    chat: {
      type: 'ref',
      required: true,
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
      const { key, subSectionKey, chat } = inputs;
      await sails.helpers.queue.consumer();

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }
      if (!campaign[subSectionKey]) {
        campaign[subSectionKey] = {};
      }

      campaign.details.name = user.name;

      let chatResponse;
      if (subSectionKey === 'aiContent') {
        chatResponse = campaign[subSectionKey][key]['content'];
      } else {
        chatResponse = campaign[subSectionKey][key];
      }
      const cmsPrompts = await sails.helpers.ai.getPrompts();
      let prompt = cmsPrompts[key];
      prompt = await sails.helpers.ai.promptReplace(prompt, campaign);

      let messages = [
        {
          role: 'system',
          content: 'You are a helpful political assistant.',
        },
        { role: 'user', content: prompt },
        ...chat,
      ];

      let engine = sails.config.custom.aiEngine || sails.config.aiEngine;

      if (engine === 'togetherAi') {
        const chatPrompt = messages
          .map((message) => message.content)
          .join('\n');
        chatResponse = await sails.helpers.ai.llmCompletion(chatPrompt);
      } else {
        // default engine is openAi
        let completion = await openai.createChatCompletion({
          model: promptTokens < 1500 ? 'gpt-3.5-turbo' : 'gpt-3.5-turbo-16k',
          max_tokens: existingChat && existingChat.length > 0 ? 2000 : 2500,
          messages: messages,
        });
        chatResponse = completion.data.choices[0].message.content;
      }

      chatResponse = chatResponse.replace('/n', '<br/><br/>');
      console.log('chatResponse', chatResponse);

      if (subSectionKey === 'aiContent') {
        campaign[subSectionKey][key]['content'] = chatResponse;
      } else {
        campaign[subSectionKey][key] = chatResponse;
      }

      await Campaign.updateOne({
        slug: campaign.slug,
      }).set({
        data: campaign,
      });
      return exits.success({
        chatResponse,
      });
    } catch (e) {
      console.log('Error generating AI response', e);
      return exits.badRequest();
    }
  },
};
