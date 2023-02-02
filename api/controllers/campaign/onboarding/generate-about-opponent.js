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
      const { adminForce } = inputs;
      const user = this.req.user;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }
      if (!campaign.aboutOpponent || (user.isAdmin && adminForce)) {
        const prompt = await sails.helpers.ai.getPrompts();

        const whyTheyRunningPrompt = prompt.whyTheyRunning;
        const whyTheyRunning = await sails.helpers.ai.createCompletion(
          whyTheyRunningPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const notBetterPrompt = prompt.notBetter;
        const notBetter = await sails.helpers.ai.createCompletion(
          notBetterPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const incumbentFailedPrompt = prompt.incumbentFailed;
        const incumbentFailed = await sails.helpers.ai.createCompletion(
          incumbentFailedPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const keyDistinctionsPrompt = prompt.keyDistinctions;
        const keyDistinctions = await sails.helpers.ai.createCompletion(
          keyDistinctionsPrompt,
          campaign,
          prompt.whyTemperature,
        );

        campaign.aboutOpponent = {
          whyTheyRunning,
          notBetter,
          incumbentFailed,
          keyDistinctions,
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

const createCompliation = async (prompt, temperature) => {
  cleanPrompt = await sails.helpers.ai.promptReplace(prompt, campaign);

  const compilation = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: cleanPrompt,
    temperature,
    max_tokens: 256,
  });

  return compilation.data.choices[0].text.replace('/n', '');
};
