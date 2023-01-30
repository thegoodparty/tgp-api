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

      newPrompt = newPrompt.replace(/\[\[firstName\]\]/g, campaign.firstName);
      newPrompt = newPrompt.replace(/\[\[lastName\]\]/g, campaign.lastName);
      newPrompt = newPrompt.replace(/\[\[zip\]\]/g, campaign.zip);
      newPrompt = newPrompt.replace(/\[\[party\]\]/g, campaign.party);
      newPrompt = newPrompt.replace(/\[\[office\]\]/g, campaign.office);
      const positionsStr = positionsToStr(campaign.positions);
      newPrompt = newPrompt.replace(/\[\[positions\]\]/g, positionsStr);
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
