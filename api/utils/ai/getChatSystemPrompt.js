async function getChatSystemPrompt(campaign) {
  let date = new Date();
  let today = date.toISOString().split('T')[0];

  const aiChatPrompts = await Content.findOne({
    key: 'aiChatPrompts',
  });

  // todo: for now there is only the General prompt
  // but we will expand for other prompts.
  const systemPrompt = aiChatPrompts.data.General.systemPrompt;
  let candidateJsonObject = aiChatPrompts.data.General.candidateJson;
  let candidateJson = JSON.stringify(candidateJsonObject);

  let candidateContext = await sails.helpers.ai.promptReplace(
    candidateJson,
    campaign,
  );

  try {
    return {
      systemPrompt,
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
