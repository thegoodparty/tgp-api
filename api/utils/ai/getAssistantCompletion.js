const { OpenAI } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

async function getAssistantCompletion(
  systemPrompt,
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

  const openai = new OpenAI({ apiKey: openAiKey });
  try {
    if (!assistantId || !systemPrompt) {
      return completion;
    }

    const myAssistant = await openai.beta.assistants.retrieve(assistantId);
    if (!myAssistant) {
      return completion;
    }

    let threadMessages;
    if (threadId) {
      if (messageId) {
        console.log('deleting message', messageId);
        const deleteResponse = await openai.beta.threads.messages.del(
          threadId,
          messageId,
        );
        console.log('deleteResponse', deleteResponse);
        // we dont add the message again for a regenerate.
        // we just delete the assistant message and re-run.
      } else {
        console.log('creating message in thread', threadId);
        threadMessages = await openai.beta.threads.messages.create(
          threadId,
          message,
        );
      }
    } else {
      console.log('creating thread');
      threadMessages = await openai.beta.threads.create({
        messages: [message],
      });
      console.log('threadMessages', threadMessages);
      // this might be a message id and not a thread id ?
      threadId = threadMessages?.id;
      console.log('threadId', threadId);
    }

    if (!threadId) {
      return completion;
    }

    console.log(`running assistant ${assistantId} on thread ${threadId}`);
    let run = await openai.beta.threads.runs.createAndPoll(
      threadId,
      // body
      {
        assistant_id: assistantId,
        additional_instructions: systemPrompt,
        model: model,
        temperature: temperature,
        top_p: topP,
        // this does not work as expected and just cuts off the response at the maxTokens
        // max_completion_tokens: maxTokens,
      },
      // options
      {
        timeout: timeout,
        maxRetries: 3,
      },
    );

    if (run.status === 'completed') {
      usage = run.usage;
      console.log(`listing messages for thread ${threadId}`);
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0];

      const content = lastMessage.content[0].text.value;
      completion = {
        content,
        threadId: lastMessage.thread_id,
        messageId: lastMessage.id,
        role: lastMessage.role,
        createdAt: lastMessage.created_at,
        usage,
      };

      return completion;
    } else {
      console.log('error running assistant', run);
    }
  } catch (error) {
    console.log('error', error);
    await sails.helpers.slack.slackHelper(
      {
        title: 'Error in AI',
        body: `Error in getChatCompletion. Error: ${error}`,
      },
      'dev',
    );
  }
  return completion;
}

module.exports = getAssistantCompletion;
