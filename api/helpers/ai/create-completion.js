const { Configuration, OpenAIApi } = require('openai');
// const { encode } = require('gpt-3-encoder');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

const configuration = new Configuration({
  apiKey: openAiKey,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  inputs: {
    messages: {
      type: 'json',
      required: true,
    },
    maxTokens: {
      type: 'number',
      defaultsTo: 500,
    },
    temperature: {
      type: 'number',
      defaultsTo: 1.0,
    },
    topP: {
      type: 'number',
      defaultsTo: 0.1,
    },
  },

  exits: {
    success: {
      outputDescription: 'Campaign Found',
    },
  },

  fn: async function (inputs, exits) {
    let { messages, maxTokens, temperature, topP } = inputs;
    let completion;
    try {
      for (let i = 0; i < messages.length; i++) {
        if (
          messages[i].content !== undefined &&
          messages[i].content.length > 0
        ) {
          // replace invalid characters
          messages[i].content = messages[i].content.replace(/\–/g, '-');
          messages[i].content = messages[i].content.replace(/\`/g, "'");
        }
      }

      // TODO: centralized token limit check
      // and possibly use gpt4-32k if response would exceed token limit.
      // let promptTokens = 0;
      // for (const message of messages) {
      //   const tokens = isWithinTokenLimit(message.content, 13000) || 13000;
      //   promptTokens += tokens;
      // }

      // i

      const model = 'gpt-4-turbo-preview';

      console.log('creating chat completion....', messages);
      completion = await openai.createChatCompletion({
        model,
        messages,
        max_tokens: maxTokens,
        top_p: topP,
        temperature,
      });
      // console.log('completion', completion);
    } catch (error) {
      console.log('Error in helpers/ai/create-compilation', error);
      if (error.response.data.error.message) {
        console.log('error message', error.response.data.error.message);
        return exits.success({ content: '', tokens: 0 });
      }
    }

    if (
      completion &&
      completion.data.choices &&
      completion.data.choices[0].message.content
    ) {
      let content = completion.data.choices[0].message.content;
      if (content.includes('```html')) {
        content = content.match(/```html([\s\S]*?)```/)[1];
      }
      content = content.replace('/n', '<br/><br/>');
      console.log('completion success', content);

      return exits.success({
        content: content,
        tokens: completion.data.usage.total_tokens,
      });
    } else {
      console.log('completion failure');
      return exits.success({ content: '', tokens: 0 });
    }
  },
};
