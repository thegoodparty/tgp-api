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
          find: 'state',
          replace: campaign.details.state,
        },
        {
          find: 'district',
          replace: campaign.details.district,
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
        const againstStr = againstToStr(campaign.goals.runningAgainst);
        replaceArr.push(
          {
            find: 'runningAgainst',
            replace: againstStr,
          },
          {
            find: 'electionDate',
            replace: campaign.goals.electionDate,
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
      if (campaign.pathToVictory) {
        const {
          projectedTurnout,
          winNumber,
          republicans,
          democrats,
          indies,
          averageTurnout,
          allAvailVoters,
          availVotersTo35,
          women,
          men,
          africanAmerican,
          white,
          asian,
          hispanic,
          voteGoal,
          voterProjection,
          totalRegisteredVoters,
          budgetLow,
          budgetHigh,
        } = campaign.pathToVictory;
        replaceArr.push(
          {
            find: 'projectedTurnout',
            replace: projectedTurnout,
          },
          {
            find: 'totalRegisteredVoters',
            replace: totalRegisteredVoters,
          },
          {
            find: 'winNumber',
            replace: winNumber,
          },
          {
            find: 'republicans',
            replace: republicans,
          },
          {
            find: 'democrats',
            replace: democrats,
          },
          {
            find: 'indies',
            replace: indies,
          },
          {
            find: 'averageTurnout',
            replace: averageTurnout,
          },
          {
            find: 'allAvailVoters',
            replace: allAvailVoters,
          },
          {
            find: 'availVotersTo35',
            replace: availVotersTo35,
          },
          {
            find: 'women',
            replace: women,
          },
          {
            find: 'men',
            replace: men,
          },
          {
            find: 'africanAmerican',
            replace: africanAmerican,
          },
          {
            find: 'white',
            replace: white,
          },
          {
            find: 'asian',
            replace: asian,
          },
          {
            find: 'hispanic',
            replace: hispanic,
          },
          {
            find: 'voteGoal',
            replace: voteGoal,
          },
          {
            find: 'voterProjection',
            replace: voterProjection,
          },
          {
            find: 'budgetLow',
            replace: budgetLow,
          },
          {
            find: 'budgetHigh',
            replace: budgetHigh,
          },
        );
      }

      replaceArr.forEach((item) => {
        try {
          newPrompt = replaceAll(newPrompt, item.find, item.replace);
        } catch (e) {
          console.log('error at prompt replace', e);
        }
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
    if (position && position.name) {
      str += `${position.name} (${
        position.topIssue ? position.topIssue.name : ''
      }) ${topIssues[`position-${position.id}`]}, `;
    }
  });
  return str;
}

function replaceAll(string, search, replace) {
  const replaceStr = replace || 'unknown';
  return string.split(`[[${search}]]`).join(replaceStr);
}

function againstToStr(runningAgainst) {
  if (!runningAgainst) {
    return '';
  }
  let str = '';
  runningAgainst.forEach((opponent) => {
    str += `name: ${opponent.name}, party: ${opponent.party} ,description: ${opponent.description}. `;
  });
  return str;
}
