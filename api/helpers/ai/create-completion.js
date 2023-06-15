const { Configuration, OpenAIApi } = require('openai');
const { encode } = require('gpt-3-encoder');

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

      // const compilation = await openai.createCompletion({
      //   model: 'text-davinci-003',
      //   prompt: cleanPrompt,
      //   temperature,
      //   max_tokens: 256,
      // });

      let model = 'gpt-3.5-turbo';
      let topP = 0.1;
      const tokens = encode(cleanPrompt);
      const encodedLength = tokens.length;
      if (encodedLength > 1000) {
        model += '-16k';
      }

      let resp = '';
      // for now we put everything in user prompt because the system prompt doesn't heed instructions as well.
      let systemPrompt = '';
      const completion = await openai.createChatCompletion({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanPrompt },
        ],
        //   max_tokens: max_length,
        top_p: topP,
        temperature: temperature,
      });
      // console.log("completion", completion);

      if (
        completion &&
        completion.data.choices &&
        completion.data.choices[0].message.content
      ) {
        resp = completion.data.choices[0].message.content.trim();
        console.log('OpenAI Response', resp);
      }
    } catch (error) {
      console.log('error', error);
      if (error.response.data.error.message) {
        console.log(
          'Error in helpers/ai/create-compilation',
          error.response.data.error.message,
        );
        return exits.success('');
      }

      return exits.success(resp.replace('/n', ''));
    }
  },
};
