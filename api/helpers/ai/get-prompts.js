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
      let content = await sails.helpers.cacheHelper('get', 'content');
      if (!content) {
        const contents = await CmsContent.find();

        if (contents.length === 1) {
          content = { ...JSON.parse(contents[0].content) };
          await sails.helpers.cacheHelper('set', 'content', content);
        }
      }
      return exits.success(content.onboardingPrompts);
    } catch (e) {
      console.log('Error in helpers/ai.getPrompt', e);
      return exits.success(false);
    }
  },
};
