const { Configuration, OpenAIApi } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

const configuration = new Configuration({
  apiKey: openAiKey,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  friendlyName: 'Find Candidate associated with user',

  inputs: {
    prompt: {
      type: 'string',
      required: true,
    },
    tokens: {
      type: 'number',
    },
    temperature: {
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'Candidate Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { prompt, tokens, temperature } = inputs;

      const completion = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt,
        temperature: temperature || 0,
        max_tokens: tokens || 30,
      });

      return exits.success({
        message: completion.data.choices[0].text,
      });
    } catch (e) {
      console.log('Error in find campaign/onboarding', e);
      return exits.badRequest(e);
    }
  },
};
