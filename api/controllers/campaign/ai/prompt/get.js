const getChatSystemPrompt = require('../../../../utils/ai/getChatSystemPrompt');
module.exports = {
  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { slug } = inputs;
      console.log('slug', slug);
      const campaign = await Campaign.findOne({ slug });
      // .populate('pathToVictory')
      // .populate('user');
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      console.log('campaign', campaign);
      let { content } = await getChatSystemPrompt(campaign);

      if (!content) {
        return exits.badRequest('No system prompt');
      }

      return exits.success({
        content,
      });
    } catch (e) {
      console.log('Error at ai/prompt/get', e);
      return exits.badRequest({ message: 'Error getting system prompt.' });
    }
  },
};
