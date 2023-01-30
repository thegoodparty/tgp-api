const { Configuration, OpenAIApi } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

const configuration = new Configuration({
  apiKey: openAiKey,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  inputs: {
    prompt: {
      required: true,
      type: 'string',
    },
    campaign: {
      required: true,
      type: 'json',
    },
    temperature: {
      required: true,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { prompt, campaign, temperature } = inputs;

      cleanPrompt = await sails.helpers.ai.promptReplace(prompt, campaign);

      const compilation = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: cleanPrompt,
        temperature,
        max_tokens: 256,
      });

      return exits.success(compilation.data.choices[0].text.replace('/n', ''));
    } catch (e) {
      console.log('Error in helpers/ai/create-compilation', e);
      return exits.success('');
    }
  },
};
