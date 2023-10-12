/* eslint-disable object-shorthand */
const { Configuration, OpenAIApi } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

const configuration = new Configuration({
  apiKey: openAiKey,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  friendlyName: 'Find top issues by location for candidate onboarding',

  inputs: {
    zip: {
      type: 'string',
      required: true,
      minLength: 5,
      maxLength: 5,
    },
  },

  exits: {
    success: {
      description: 'Issues found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Issues Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { zip } = inputs;

      const completion = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        max_tokens: 3000,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful political assistant.',
          },
          {
            role: 'user',
            content: `Please list only the top three political issues in ${zip} zip code (including city and state), based on what you think they would be, to the best of your ability, without any explanation. Your response should be a string separated with commas that I can convert to a javascript array with .split(',') function. each issue should be in Title Case`,
          },
        ],
      });
      chatResponse = completion.data.choices[0].message.content;
      const issues = chatResponse.split(',');
      issues.forEach((issue, index) => {
        issues[index] = issue.trim();
      });

      return exits.success({
        issues,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      // return exits.notFound();
      return exits.success({
        issues: [],
      });
    }
  },
};
