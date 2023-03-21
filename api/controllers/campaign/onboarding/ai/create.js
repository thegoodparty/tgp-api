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
      const { key, subSectionKey, regenerate } = inputs;

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

      let chatResponse = campaign[subSectionKey][key];
      if (!campaign[subSectionKey][key] || regenerate) {
        const cmsPrompts = await sails.helpers.ai.getPrompts();
        let prompt = cmsPrompts[key];
        prompt = await sails.helpers.ai.promptReplace(prompt, campaign);

        const completion = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          max_tokens: 3000,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful political assistant.',
            },
            { role: 'user', content: prompt },
          ],
        });
        chatResponse = completion.data.choices[0].message.content.replace(
          '/n',
          '<br/><br/>',
        );

        campaign[subSectionKey][key] = chatResponse;
        await Campaign.updateOne({
          slug: campaign.slug,
        }).set({
          data: campaign,
        });
      }
      return exits.success({
        chatResponse,
      });
    } catch (e) {
      console.log('Error generating AI response', e);
      return exits.badRequest();
    }
  },
};
