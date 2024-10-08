const llmChatCompletion = require('../../../utils/ai/llmChatCompletion');

module.exports = {
  friendlyName: 'Test llm',

  description: 'Test the llm integration.',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    // const response = await llmChatCompletion(['hello'], 50, 0.5, 0.9);

    const response = await sails.helpers.ballotready.extractLocationAi(
      'Los Angeles School Board District 15 - CA',
      'local',
    );

    console.log(response);
    return exits.success({
      message: response,
    });
  },
};
