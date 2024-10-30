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

    if (
      model.includes('meta-llama') &&
      toolChoice?.function?.name &&
      toolChoice.function.name === 'matchLabels'
    ) {
      // this function spec breaks the together.ai api
      // so we just use better prompt to get the same result
      tools = undefined;
      toolChoice = undefined;
    }

    let completion;
    try {
      if (tools) {
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
      } else {
        completion = await client.chat.completions.create(
          {
            model,
            messages,
            top_p: topP,
            temperature: temperature,
          },
          {
            timeout,
          },
        );
      }

      const completionJson = JSON.stringify(completion, null, 2);
      // console.log('completionJson', completionJson);

      let toolsUsed = tools ? 'Yes' : 'No';
      let content = '';
      if (completion?.choices && completion.choices[0]?.message) {
        if (tools && completion.choices[0].message?.tool_calls) {
          // console.log('completion (json)', JSON.stringify(completion, null, 2));
          let toolCalls = completion.choices[0].message.tool_calls;
          if (toolCalls && toolCalls.length > 0) {
            content = toolCalls[0]?.function?.arguments || '';
          }
          if (content === '') {
            // we are expecting tool_calls to have a function call response
            // but we can check if the model returned a response without a function call
            content = completion.choices[0].message?.content || '';
            if (content !== '') {
              await sails.helpers.slack.slackHelper(
                {
                  title: 'Error in AI',
                  body: `getChatToolCompletion. model: ${model}. Tools Used: ${toolsUsed}. No tool_calls found. content without function call found: ${content}. raw completion: ${completionJson}`,
                },
                'dev',
              );
              // todo: may need to parse the <function> tag from the content with no tool_calls.
            }
          }
        } else {
          // console.log('completion (raw)', completion);
          content = completion.choices[0].message?.content || '';
        }
      }

      if (content && typeof content === 'string') {
        content = content.trim();
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
