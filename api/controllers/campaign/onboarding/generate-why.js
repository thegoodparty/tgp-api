const { Configuration, OpenAIApi } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

const configuration = new Configuration({
  apiKey: openAiKey,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  inputs: {
    adminForce: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;
      const { adminForce } = inputs;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }
      if (!campaign.whyGoals || (user.isAdmin && adminForce)) {
        const prompt = await sails.helpers.ai.getPrompts();
        let whyPrompt = prompt.whyPrompt;
        whyPrompt = await sails.helpers.ai.promptReplace(whyPrompt, campaign);

        const completion100 = await openai.createCompletion({
          model: 'text-davinci-003',
          prompt: whyPrompt,
          temperature: prompt.whyTemperature || 0.5,
          max_tokens: 256,
        });

        const why100 = completion100.data.choices[0].text.replace('/n', '');

        campaign.whyGoals = {
          why100,
        };
        await Campaign.updateOne({
          slug: campaign.slug,
        }).set({
          data: campaign,
        });
      }
      return exits.success({
        campaign,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.badRequest();
    }
  },
};
