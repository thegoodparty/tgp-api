const { OpenAI } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

// This function supports tools such as function calls.
async function getChatCompletion(
  messages = [],
  model = 'gpt-4o',
  temperature = 0.1,
  topP = 0.1,
  tools = undefined, // list of functions that could be called.
  toolChoice = undefined, // force the function to be called on every generation if needed.
  timeout = 300000, // timeout request after 5 minutes
) {
  const openai = new OpenAI({ apiKey: openAiKey });
  let completion;
  try {
    completion = await openai.chat.completions.create(
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
      if (tools !== undefined) {
        content =
          completion.choices[0].message?.tool_calls?.[0].function.arguments ||
          '';
      } else {
        content = completion.choices[0].message?.content?.trim() || '';
      }
    }
    return {
      content: content,
      tokens: completion?.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.log('error', error);
  }
  return {
    content: '',
    tokens: 0,
  };
}

module.exports = getChatCompletion;
