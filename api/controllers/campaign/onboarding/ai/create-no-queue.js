const { Configuration, OpenAIApi } = require('openai');
const openAiKey = sails.config.custom.openAi || sails.config.openAi;

const AiConfiguration = new Configuration({
  apiKey: openAiKey,
});
const openai = new OpenAIApi(AiConfiguration);

module.exports = {
  inputs: {
    key: {
      type: 'string',
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
      const { key } = inputs;
      const user = this.req.user;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }
      const cmsPrompts = await sails.helpers.ai.getPrompts();
      let prompt = cmsPrompts[key];
      prompt = await sails.helpers.ai.promptReplace(prompt, campaign);
      let messages = [{ role: 'user', content: prompt }];

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
          max_tokens: 500,
          messages: messages,
        });
        chatResponse = completion.data.choices[0].message.content;
      }

      chatResponse = chatResponse.replace('/n', '<br/><br/>');
      console.log('chatResponse', chatResponse);

      return exits.success({
        aiResponse: chatResponse,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.badRequest();
    }
  },
};
