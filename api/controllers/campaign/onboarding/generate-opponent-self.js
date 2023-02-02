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
      if (!campaign.opponentSelf || (user.isAdmin && adminForce)) {
        const prompt = await sails.helpers.ai.getPrompts();

        const whatRunningPrompt = prompt.whatRunning;
        const whatRunning = await sails.helpers.ai.createCompletion(
          whatRunningPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const howDeliveredPrompt = prompt.howDelivered;
        const howDelivered = await sails.helpers.ai.createCompletion(
          howDeliveredPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const whatDeliveredPrompt = prompt.whatDelivered;
        const whatDelivered = await sails.helpers.ai.createCompletion(
          whatDeliveredPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const votePrompt = prompt.vote;
        const vote = await sails.helpers.ai.createCompletion(
          votePrompt,
          campaign,
          prompt.whyTemperature,
        );

        campaign.opponentSelf = {
          whatRunning,
          howDelivered,
          whatDelivered,
          vote,
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
