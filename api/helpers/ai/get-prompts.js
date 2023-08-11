module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let content;
      const contents = await CmsContent.find();

      if (contents.length > 0) {
        content = { ...JSON.parse(contents[0].content) };
      }
      const combined = {
        ...content.onboardingPrompts,
        ...content.candidateContentPrompts,
      };

      return exits.success(combined);
    } catch (e) {
      console.log('Error in helpers/ai.getPrompt', e);
      return exits.success(false);
    }
  },
};
