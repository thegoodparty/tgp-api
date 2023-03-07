module.exports = {
  inputs: {
    prompt: {
      required: true,
      type: 'string',
    },
    campaign: {
      required: true,
      type: 'json',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { prompt, campaign } = inputs;
      let newPrompt = prompt;

      newPrompt = newPrompt.replace(/\[\[name\]\]/g, campaign.details.name);
      newPrompt = newPrompt.replace(/\[\[zip\]\]/g, campaign.details.zip);
      newPrompt = newPrompt.replace(/\[\[party\]\]/g, campaign.details.party);
      newPrompt = newPrompt.replace(/\[\[office\]\]/g, campaign.details.office);

      newPrompt += `\n
        
      `;
      return exits.success(newPrompt);
    } catch (e) {
      console.log('Error in helpers/ai/promptReplace', e);
      return exits.success('');
    }
  },
};

function positionsToStr(positions) {
  let str = '';
  positions.forEach((position) => {
    str += `${position.name} (${position.topIssue.name}), `;
  });
  return str;
}
