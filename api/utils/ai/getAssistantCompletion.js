const llmChatCompletion = require('./llmChatCompletion');
const crypto = require('crypto');

async function getAssistantCompletion(
  systemPrompt,
  candidateContext,
  assistantId,
  threadId,
  message,
  messageId,
  model = 'gpt-4o',
  temperature = 0.7,
  topP = 0.1,
  //   maxTokens = 500,
  timeout = 60000, // timeout request after 1 minutes
) {
  let completion;

  try {
    if (!assistantId || !systemPrompt) {
      console.log('missing assistantId or systemPrompt');
      console.log('assistantId', assistantId);
      console.log('systemPrompt', systemPrompt);
      return completion;
    }

    if (!threadId) {
      console.log('missing threadId');
      return completion;
    }

    console.log(`running assistant ${assistantId} on thread ${threadId}`);

    let messages = [];
    messages.push({
      content: systemPrompt + '\n' + candidateContext,
      role: 'system',
      createdAt: new Date().valueOf(),
      messageId: crypto.randomUUID(),
    });

    const aiChat = await AIChat.findOne({
      thread: threadId,
    });

    if (aiChat && aiChat?.data && aiChat?.data?.messages) {
      messages.push(...aiChat.data.messages);
    }

    if (messageId) {
      console.log('deleting message', messageId);
      messages = messages.filter((m) => m.id !== messageId);
    } else {
      messages.push({
        content: message.content,
        role: 'user',
        createdAt: new Date().valueOf(),
        messageId: crypto.randomUUID(),
      });
    }

    console.log('messages', messages);

    let result = await llmChatCompletion(messages, 500, temperature, topP);

    completion = {
      content: result?.content,
      threadId,
      messageId: crypto.randomUUID(),
      role: 'assistant',
      createdAt: new Date().valueOf(),
      usage: result?.tokens,
    };

    return completion;
  } catch (error) {
    console.log('error', error);
    await sails.helpers.slack.slackHelper(
      {
        title: 'Error in AI',
        body: `Error in getAssistantCompletion. Error: ${error}`,
      },
      'dev',
    );
  }
  return completion;
}

module.exports = getAssistantCompletion;
