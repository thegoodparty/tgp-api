const { ChatOpenAI } = require('@langchain/openai');
const {
  ChatTogetherAI,
} = require('@langchain/community/chat_models/togetherai');
// const { ChatAnthropic } = require('@langchain/anthropic');
const togetherAiKey = sails.config.custom.togetherAi || sails.config.togetherAi;
const openAiKey = sails.config.custom.openAi || sails.config.openAi;

// This implementation does not support function calling.
// For that you must use the getChatCompletion function
async function llmChatCompletion(
  messages,
  maxTokens = 500,
  temperature = 1.0,
  topP = 0.1,
) {
  const OpenAIModel = new ChatOpenAI({
    apiKey: openAiKey,
    model: 'gpt-4o',
    maxTokens,
    temperature,
    topP,
    maxRetries: 0,
  });

  const togetherAiModel = new ChatTogetherAI({
    apiKey: togetherAiKey,
    model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    maxTokens,
    temperature,
    topP,
    maxRetries: 0,
  });

  // note: anthropic does not support function calling.
  // see: https://docs.together.ai/docs/function-calling
  // const anthropicModel = new ChatAnthropic({});
  //   const anthropicModel = new ChatAnthropic({
  //     apiKey: anthropicKey,
  //     model: 'claude-3-5-sonnet-20240620',
  //     maxTokens,
  //     temperature,
  //     topP,
  //     maxRetries: 0,
  //   });

  const modelWithFallback = OpenAIModel.withFallbacks([togetherAiModel]);
  // const modelWithFallback = togetherAiModel.withFallbacks([OpenAIModel]);

  for (let i = 0; i < messages.length; i++) {
    if (messages[i].content !== undefined && messages[i].content.length > 0) {
      // replace invalid characters
      messages[i].content = messages[i].content.replace(/\–/g, '-');
      messages[i].content = messages[i].content.replace(/\`/g, "'");
    }
  }

  let completion;
  try {
    completion = await modelWithFallback.invoke(messages);
  } catch (error) {
    console.log('Error in utils/ai/llmChatCompletion', error);
    console.log('error response', error?.response);

    await sails.helpers.slack.errorLoggerHelper(
      'Error in AI completion (raw)',
      error,
    );
  }

  if (completion && completion.content) {
    return {
      content: completion?.content || '',
      tokens: completion?.response_metadata?.tokenUsage?.totalTokens || 0,
    };
  } else {
    return {
      content: '',
      tokens: 0,
    };
  }
}

module.exports = llmChatCompletion;
