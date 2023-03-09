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

      const positionsStr = positionsToStr(campaign.details.topIssues);

      newPrompt = newPrompt.replace(
        /\[\[name\]\]/g,
        `${campaign.details.firstName} ${campaign.details.lastName}`,
      );
      newPrompt = newPrompt.replace(/\[\[zip\]\]/g, campaign.details.zip);
      newPrompt = newPrompt.replace(/\[\[party\]\]/g, campaign.details.party);
      newPrompt = newPrompt.replace(/\[\[office\]\]/g, campaign.details.office);
      newPrompt = newPrompt.replace(/\[\[positions\]\]/g, positionsStr);
      newPrompt = newPrompt.replace(
        /\[\[pastExperience\]\]/g,
        campaign.details.pastExperience,
      );
      newPrompt = newPrompt.replace(
        /\[\[occupation\]\]/g,
        campaign.details.occupation,
      );
      newPrompt = newPrompt.replace(
        /\[\[funFact\]\]/g,
        campaign.details.funFact,
      );
      newPrompt = newPrompt.replace(
        /\[\[positions\]\]/g,
        campaign.details.positionsStr,
      );
      if (campaign.goals) {
        newPrompt = newPrompt.replace(
          /\[\[runningAgainstName\]\]/g,
          campaign.goals.runningAgainstName,
        );

        newPrompt = newPrompt.replace(
          /\[\[runningAgainstDescription\]\]/g,
          campaign.goals.runningAgainstDescription,
        );

        newPrompt = newPrompt.replace(
          /\[\[runningAgainstName\]\]/g,
          campaign.goals.runningAgainstName,
        );

        newPrompt = newPrompt.replace(
          /\[\[whyRunning\]\]/g,
          campaign.goals.whyRunning,
        );
      }

      newPrompt += `\n
        
      `;
      return exits.success(newPrompt);
    } catch (e) {
      console.log('Error in helpers/ai/promptReplace', e);
      return exits.success('');
    }
  },
};

function positionsToStr(topIssues) {
  if (!topIssues) {
    return '';
  }
  const { positions } = topIssues;
  if (!positions) {
    return '';
  }
  let str = '';
  positions.forEach((position, index) => {
    str += `${position.name} (${position.topIssue.name}) ${
      topIssues[`position-${index + 1}`]
    }, `;
  });
  return str;
}
