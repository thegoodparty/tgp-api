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
      if (!campaign.whatGoals || (user.isAdmin && adminForce)) {
        const prompt = await sails.helpers.ai.getPrompts();

        const whyRunningPrompt = prompt.whyRunning;
        const whyRunning = await sails.helpers.ai.createCompletion(
          whyRunningPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const bestChoicePrompt = prompt.whyRunning;
        const bestChoice = await sails.helpers.ai.createCompletion(
          bestChoicePrompt,
          campaign,
          prompt.whyTemperature,
        );

        const howDeliverPrompt = prompt.whyRunning;
        const howDeliver = await sails.helpers.ai.createCompletion(
          howDeliverPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const whatDeliverPrompt = prompt.whyRunning;
        const whatDeliver = await sails.helpers.ai.createCompletion(
          whatDeliverPrompt,
          campaign,
          prompt.whyTemperature,
        );

        const voteReasonPrompt = prompt.whyRunning;
        const voteReason = await sails.helpers.ai.createCompletion(
          voteReasonPrompt,
          campaign,
          prompt.whyTemperature,
        );

        campaign.whatGoals = {
          whyRunning,
          bestChoice,
          howDeliver,
          whatDeliver,
          voteReason,
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
