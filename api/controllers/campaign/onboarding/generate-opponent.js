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
      if (!campaign.opponent || (user.isAdmin && adminForce)) {
        const prompt = await sails.helpers.ai.getPrompts();

        const notBestChoicePrompt = prompt.notBestChoice;
        const notBestChoice = await sails.helpers.ai.createCompletion(
          notBestChoicePrompt,
          campaign,
          prompt.whyTemperature,
        );

        const notDeliverPrompt = prompt.notDeliver;
        const notDeliver = await sails.helpers.ai.createCompletion(
          notDeliverPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const distinctionsPrompt = prompt.distinctions;
        const distinctions = await sails.helpers.ai.createCompletion(
          distinctionsPrompt,
          campaign,
          prompt.whyTemperature,
        );

        campaign.opponent = {
          notBestChoice,
          notDeliver,
          distinctions,
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
