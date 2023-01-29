const { Configuration, OpenAIApi } = require('openai');

const openAiKey = sails.config.custom.openAi || sails.config.openAi;

const configuration = new Configuration({
  apiKey: openAiKey,
});

const openai = new OpenAIApi(configuration);

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }
      if (!campaign.whyGoals) {
        const prompt = await cmsPropmt();
        let whyPrompt = prompt.whyPrompt;

        whyPrompt = whyPrompt.replace(/\[\[firstName\]\]/g, campaign.firstName);
        whyPrompt = whyPrompt.replace(/\[\[lastName\]\]/g, campaign.lastName);
        whyPrompt = whyPrompt.replace(/\[\[zip\]\]/g, campaign.zip);
        whyPrompt = whyPrompt.replace(/\[\[party\]\]/g, campaign.party);
        whyPrompt = whyPrompt.replace(/\[\[office\]\]/g, campaign.office);
        whyPrompt = whyPrompt.replace(
          /\[\[positions\]\]/g,
          positionsStr(campaign.positions),
        );
        whyPrompt += `
        
        `;

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
      return exits.notFound();
    }
  },
};

const cmsPropmt = async () => {
  let content = await sails.helpers.cacheHelper('get', 'content');
  if (!content) {
    const contents = await CmsContent.find();

    if (contents.length === 1) {
      content = { ...JSON.parse(contents[0].content) };
      await sails.helpers.cacheHelper('set', 'content', content);
    }
  }
  return content.onboardingPrompts;
};

const positionsStr = (positions) => {
  let str = '';
  positions.forEach((position) => {
    str += `${position.name} (${position.topIssue.name}), `;
  });
  return str;
};
