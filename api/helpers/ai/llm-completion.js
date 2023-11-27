const axios = require('axios');

module.exports = {
  inputs: {
    prompt: {
      required: true,
      type: 'string',
    },
    campaign: {
      required: false,
      type: 'json',
    },
    temperature: {
      required: false,
      type: 'number',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { prompt } = inputs;
      const togetherApiKey =
        sails.config.custom.togetherAi || sails.config.togetherAi;

      let response = '';
      const url = 'https://api.together.xyz/v1/completions';
      response = await axios({
        url,
        method: 'POST',
        data: {
          model: 'togethercomputer/llama-2-70b-chat',
          prompt: prompt,
          max_tokens: 2000,
          //   stop: '.',
          temperature: 1.0,
          top_p: 0.7,
          top_k: 50,
          repetition_penalty: 1.18,
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${togetherApiKey}`,
        },
      });

      let responseText;
      try {
        responseText = response?.data?.choices[0].text;
      } catch (error) {
        console.log('API Error in helpers/ai/llm-completion', error);
      }
      //   console.log('responseText', responseText);
      return exits.success(responseText);
    } catch (error) {
      console.log('Unknown Error in helpers/ai/llm-completion', error);
    }
    return exits.success('');
  },
};
