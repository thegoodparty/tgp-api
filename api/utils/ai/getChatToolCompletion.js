const { OpenAI } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;
const togetherAiKey = sails.config.custom.togetherAi || sails.config.togetherAi;
const aiModels = sails.config.custom.aiModels || sails.config.aiModels || '';

// This function supports tools such as function calls.
async function getChatToolCompletion(
  messages = [],
  temperature = 0.1,
  topP = 0.1,
  tools = undefined, // list of functions that could be called.
  toolChoice = undefined, // force the function to be called on every generation if needed.
  timeout = 300000, // timeout request after 5 minutes
) {
  const models = aiModels.split(',');
  for (const model of models) {
    // Lama 3.1 supports native function calling
    // so we can modify the OpenAI base url to use the together.ai api
    console.log('model', model);
    const togetherAi = model.includes('meta-llama');
    const client = new OpenAI({
      apiKey: togetherAi ? togetherAiKey : openAiKey,
      baseURL: togetherAi ? 'https://api.together.xyz/v1' : undefined,
    });

    let completion;
    try {
      completion = await client.chat.completions.create(
        {
          model,
          messages,
          top_p: topP,
          temperature: temperature,
          tools,
          tool_choice: toolChoice,
        },
        {
          timeout,
        },
      );

      let content = '';
      if (completion?.choices && completion.choices[0]?.message) {
        if (completion.choices[0].message?.tool_calls) {
          // console.log('completion (json)', JSON.stringify(completion, null, 2));
          content =
            completion.choices[0].message?.tool_calls?.[0].function.arguments ||
            '';
        } else {
          // console.log('completion (raw)', completion);
          content = completion.choices[0].message?.content?.trim() || '';
        }
      }

      if (content.includes('```html')) {
        content = content.match(/```html([\s\S]*?)```/)[1];
      }
      content = content.replace('/n', '<br/><br/>');
      console.log('completion success', content);
      return {
        content: content,
        tokens: completion?.usage?.total_tokens || 0,
      };
    } catch (error) {
      console.log('error', error);
      await sails.helpers.slack.slackHelper(
        {
          title: 'Error in AI',
          body: `Error in getChatToolCompletion. model: ${model} Error: ${error}`,
        },
        'dev',
      );
    }
  }

  return {
    content: '',
    tokens: 0,
  };
}

module.exports = getChatToolCompletion;
