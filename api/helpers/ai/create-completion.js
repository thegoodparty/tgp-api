const { OpenAI } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;
const openai = new OpenAI({ apiKey: openAiKey });

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

      const model = 'gpt-4o';

      // console.log('creating chat completion....', messages);
      completion = await openai.chat.completions.create({
        model,
        messages,
        top_p: topP,
        temperature,
        max_tokens: maxTokens,
      });
    } catch (error) {
      console.log('Error in helpers/ai/create-compilation', error);
      console.log('error response', error?.response);
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.message
      ) {
        console.log('error message', error.response.data.error.message);
        return exits.success({ content: '', tokens: 0 });
      }
    }
    // console.log('completion', JSON.stringify(completion));

    if (
      completion &&
      completion.choices &&
      completion.choices[0].message.content
    ) {
      let content = completion.choices[0].message.content;
      if (content.includes('```html')) {
        content = content.match(/```html([\s\S]*?)```/)[1];
      }
      content = content.replace('/n', '<br/><br/>');
      console.log('completion success', content);

      return exits.success({
        content: content,
        tokens: completion.usage.total_tokens,
      });
    } else {
      console.log('completion failure');
      return exits.success({ content: '', tokens: 0 });
    }
  },
};
