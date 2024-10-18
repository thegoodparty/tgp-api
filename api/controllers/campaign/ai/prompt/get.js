const getChatSystemPrompt = require('../../../../utils/ai/getChatSystemPrompt');
module.exports = {
  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
    initial: {
      type: 'boolean',
      defaultsTo: false,
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
      const { slug, initial } = inputs;
      console.log('slug', slug);
      const campaign = await Campaign.findOne({ slug });
      // .populate('pathToVictory')
      // .populate('user');
      if (!campaign) {
        return exits.badRequest('No campaign');
      }

      // console.log('campaign', campaign);
      const { candidateContext, systemPrompt } = await getChatSystemPrompt(
        campaign,
        initial,
      );

      if (!candidateContext || !systemPrompt) {
        return exits.badRequest('No system prompt');
      }

      return exits.success({
        candidateContext,
        systemPrompt,
      });
    } catch (e) {
      console.log('Error at ai/prompt/get', e);
      return exits.badRequest({ message: 'Error getting system prompt.' });
    }
  },
};
