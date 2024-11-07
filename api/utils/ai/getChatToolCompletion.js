const { OpenAI } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;
const togetherAiKey = sails.config.custom.togetherAi || sails.config.togetherAi;
const aiModels = sails.config.custom.aiModels || sails.config.aiModels || '';

// This function supports tools such as function calls.
async function getChatToolCompletion(
  messages = [],
  temperature = 0.1,
  topP = 0.1,
  tool = undefined, // list of functions that could be called.
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

    let toolPrompt;
    if (model.includes('meta-llama')) {
      // the native function calling in llama is not working as expected
      // so we use this function prompt to get the same result
      toolPrompt = `You have access to the following functions:

      Use the function '${tool.name}' to '${tool.description}':
      ${JSON.stringify(tool)}
      
      If you choose to call a function ONLY reply in the following format with no prefix or suffix:
      
      <function=example_function_name>{"example_name": "example_value"}</function>
      
      Reminder:
      - Function calls MUST follow the specified format, start with <function= and end with </function>
      - Required parameters MUST be specified
      - Only call one function at a time
      - Put the entire function call reply on one line
      - If there is no function call available, answer the question like normal with your current knowledge and do not tell the user about function calls`;

      // add the tool prompt to the last system message
      for (const message of messages) {
        if (message.role === 'system') {
          message.content += toolPrompt;
          break;
        }
      }

      tool = undefined;
      toolChoice = undefined;
    }

    console.log('toolChoice', toolChoice);

    let completion;
    try {
      if (tool) {
        completion = await client.chat.completions.create(
          {
            model,
            messages,
            top_p: topP,
            temperature: temperature,
            tools: [tool],
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

      // const completionJson = JSON.stringify(completion, null, 2);
      // console.log('completionJson', completionJson);
      let content = '';
      if (completion?.choices && completion.choices[0]?.message) {
        if (completion.choices[0].message?.tool_calls) {
          // console.log('completion (json)', JSON.stringify(completion, null, 2));
          let toolCalls = completion.choices[0].message.tool_calls;
          if (toolCalls && toolCalls.length > 0) {
            content = toolCalls[0]?.function?.arguments || '';
          }
          if (content === '') {
            // we are expecting tool_calls to have a function call response
            // but we can check if the model returned a response without a function call
            content = completion.choices[0].message?.content || '';
          }
        } else {
          // console.log('completion (raw)', completion);
          content = completion.choices[0].message?.content || '';
        }
      }

      if (content && typeof content === 'string') {
        content = content.trim();
      }

      if (content && content !== '') {
        if (content.includes('<function=')) {
          // there is some bug either with openai client, llama3.1 native FC, or together.ai api
          // where the tool_calls are not being returned in the response
          // so we can parse the function call from the content
          let toolResponse = parseToolResponse(content);
          if (toolResponse) {
            content = toolResponse.arguments;
          }
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

function parseToolResponse(response) {
  const functionRegex = /<function=(\w+)>(.*?)<\/function>/;
  const match = response.match(functionRegex);

  if (match) {
    const [functionName, argsString] = match;
    try {
      const args = JSON.parse(argsString);
      return {
        function: functionName,
        arguments: args,
      };
    } catch (error) {
      console.log(`Error parsing function arguments: ${error}`);
      return undefined;
    }
  }
  return undefined;
}

module.exports = getChatToolCompletion;
