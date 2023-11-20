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
      const onboardingPrompts = await Content.findOne({
        key: 'onboardingPrompts',
      });
      const candidateContentPrompts = await Content.findOne({
        key: 'candidateContentPrompts',
      });

      const combined = {
        ...onboardingPrompts.data,
        ...candidateContentPrompts.data,
      };

      return exits.success(combined);
    } catch (e) {
      console.log('Error in helpers/ai.getPrompt', e);
      return exits.success(false);
    }
  },
};
