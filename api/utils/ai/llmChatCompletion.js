const { ChatOpenAI } = require('@langchain/openai');
const {
  ChatTogetherAI,
} = require('@langchain/community/chat_models/togetherai');
// const { ChatAnthropic } = require('@langchain/anthropic');
const togetherAiKey = sails.config.custom.togetherAi || sails.config.togetherAi;
const openAiKey = sails.config.custom.openAi || sails.config.openAi;
const aiModels = sails.config.custom.aiModels || sails.config.aiModels || '';

// This implementation does not support function calling.
// For that you must use the getChatToolCompletion function
async function llmChatCompletion(
  messages,
  maxTokens = 500,
  temperature = 1.0,
  topP = 0.1,
) {
  const models = aiModels.split(',');
  if (models.length === 0) {
    await sails.helpers.slack.slackHelper(
      {
        title: 'Error',
        body: `AI Models are not configured. Please specify AI models.`,
      },
      'dev',
    );
  }

  let aiOptions = {
    maxTokens,
    temperature,
    topP,
    maxRetries: 0,
  };

  let firstModel;
  let fallbackModel;

  for (const model of models) {
    if (model.includes('gpt')) {
      if (!firstModel) {
        firstModel = new ChatOpenAI({
          apiKey: openAiKey,
          model,
          ...aiOptions,
        });
      } else {
        fallbackModel = new ChatOpenAI({
          apiKey: openAiKey,
          model,
          ...aiOptions,
        });
      }
    } else {
      if (!firstModel) {
        firstModel = new ChatTogetherAI({
          apiKey: togetherAiKey,
          model,
          ...aiOptions,
        });
      } else {
        fallbackModel = new ChatTogetherAI({
          apiKey: togetherAiKey,
          model,
          ...aiOptions,
        });
      }
    }
  }

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

  const modelWithFallback = firstModel.withFallbacks([fallbackModel]);
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

  if (completion && completion?.content) {
    let content = completion.content;
    if (content.includes('```html')) {
      content = content.match(/```html([\s\S]*?)```/)[1];
    }
    content = content.replace('/n', '<br/><br/>');

    return {
      content,
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
