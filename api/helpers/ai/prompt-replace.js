const { forEach } = require('lodash');

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
      const replaceArr = [
        {
          find: 'name',
          replace: `${campaign.details.firstName} ${campaign.details.lastName}`,
        },
        {
          find: 'zip',
          replace: campaign.details.zip,
        },
        {
          find: 'party',
          replace: campaign.details.party || campaign.details.otherParty,
        },
        {
          find: 'office',
          replace: campaign.details.office,
        },
        {
          find: 'positions',
          replace: positionsStr,
        },
        {
          find: 'pastExperience',
          replace: campaign.details.pastExperience,
        },
        {
          find: 'occupation',
          replace: campaign.details.occupation,
        },
        {
          find: 'funFact',
          replace: campaign.details.funFact,
        },
      ];
      if (campaign.goals) {
        replaceArr.push(
          {
            find: 'runningAgainstName',
            replace: campaign.goals.runningAgainstName,
          },
          {
            find: 'electionDate',
            replace: campaign.goals.electionDate,
          },
          {
            find: 'runningAgainstDescription',
            replace: campaign.goals.runningAgainstDescription,
          },
          {
            find: 'whyRunning',
            replace: campaign.goals.whyRunning,
          },
          {
            find: 'campaignCommittee',
            replace: campaign.goals.campaignCommittee,
          },
          {
            find: 'statementName',
            replace: campaign.goals.statementName,
          },
        );
      }

      replaceArr.forEach((item) => {
        newPrompt = replaceAll(newPrompt, item.find, item.replace);
      });

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

function replaceAll(string, search, replace) {
  const replaceStr = replace || 'unknown';
  return string.split(`[[${search}]]`).join(replaceStr);
}
