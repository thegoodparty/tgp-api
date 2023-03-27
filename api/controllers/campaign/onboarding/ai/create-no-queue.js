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

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        max_tokens: 500,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful political assistant.',
          },
          { role: 'user', content: prompt },
        ],
      });
      aiResponse = completion.data.choices[0].message.content.replace(
        '/n',
        '<br/><br/>',
      );

      return exits.success({
        aiResponse,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.badRequest();
    }
  },
};
