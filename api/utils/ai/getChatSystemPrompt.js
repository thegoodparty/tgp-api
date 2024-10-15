async function getChatSystemPrompt(campaign, initial = false) {
  let date = new Date();
  let today = date.toISOString().split('T')[0];

  const aiChatPrompts = await Content.findOne({
    key: 'aiChatPrompts',
  });

  const initialPrompt = aiChatPrompts.data.General.initialPrompt;
  const systemPrompt = aiChatPrompts.data.General.systemPrompt;
  let candidateJsonObject = aiChatPrompts.data.General.candidateJson;
  let candidateJson = JSON.stringify(candidateJsonObject);

  let candidateContext = await sails.helpers.ai.promptReplace(
    candidateJson,
    campaign,
  );

  try {
    return {
      systemPrompt: initial ? initialPrompt : systemPrompt,
      candidateContext,
    };
  } catch (error) {
    console.log('error', error);
    await sails.helpers.slack.slackHelper(
      {
        title: 'Error in System prompt',
        body: `Error in getChatSystemPrompt. Error: ${error}`,
      },
      'dev',
    );
  }
  return {
    systemPrompt: '',
    candidateContext: '',
  };
}

module.exports = getChatSystemPrompt;
