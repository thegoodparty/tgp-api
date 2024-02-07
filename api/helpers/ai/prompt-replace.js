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

      const campaignPositions = await CandidatePosition.find({
        campaign: campaign.id,
      })
        .populate('topIssue')
        .populate('position');

      let name = campaign.name;
      if (!name && campaign.details?.firstName && campaign.details?.lastName) {
        name = `${campaign.details?.firstName} ${campaign.details?.lastName}`;
      }
      if (!name) {
        // the name is on the user (old records)
        const campaignRecord = await Campaign.findOne({
          id: campaign.id,
        }).populate('user');
        name = campaignRecord.user?.name;
        if (name) {
          await Campaign.updateOne({ id: campaign.id }).set({
            data: { ...campaign.data, name },
          });
        }
      }

      const positionsStr = positionsToStr(
        campaignPositions,
        campaign.customIssues,
      );
      const party =
        campaign.details?.party === 'Other'
          ? campaign.details.otherParty
          : campaign.details?.party;

      const office =
        campaign.details?.office === 'Other'
          ? campaign.details.otherOffice
          : campaign.details?.office;

      const replaceArr = [
        {
          find: 'name',
          replace: name,
        },
        {
          find: 'zip',
          replace: campaign.details.zip,
        },
        {
          find: 'party',
          replace: party,
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
          replace: `${office}${
            campaign.details.district ? ` in ${campaign.details.district}` : ''
          }`,
        },
        {
          find: 'positions',
          replace: positionsStr,
        },
        {
          find: 'pastExperience',
          replace:
            typeof campaign.details.pastExperience === 'string'
              ? campaign.details.pastExperience
              : JSON.stringify(campaign.details.pastExperience || {}),
        },
        {
          find: 'occupation',
          replace: campaign.details.occupation,
        },
        {
          find: 'funFact',
          replace: campaign.details.funFact,
        },
        {
          find: 'campaignCommittee',
          replace:
            campaign.details.campaignCommittee ||
            campaign.goals?.campaignCommittee ||
            'unknown',
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
          // {
          //   find: 'whyRunning',
          //   replace: campaign.goals.whyRunning,
          // },

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

      console.log('new prompt', newPrompt);
      return exits.success(newPrompt);
    } catch (e) {
      console.log('Error in helpers/ai/promptReplace', e);
      return exits.success('');
    }
  },
};

function positionsToStr(campaignPositions, customIssues) {
  if (!campaignPositions && !customIssues) {
    return '';
  }
  let str = '';
  campaignPositions.forEach((campaignPosition, i) => {
    const { position, topIssue } = campaignPosition;
    str += `Issue #${i + 1}: ${topIssue.name}. Position on the issue: ${
      position.name
    }. Candidate's position: ${campaignPosition.description}. `;
  });

  if (customIssues) {
    customIssues.forEach((issue) => {
      str += `${issue.title} - ${issue.position}, `;
    });
  }
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
  if (runningAgainst.length > 1) {
    str = `${runningAgainst.length} candidates who are: `;
  }
  runningAgainst.forEach((opponent, index) => {
    if (index > 0) {
      str += 'and also running against ';
    }
    str += `name: ${opponent.name}, party: ${opponent.party} ,description: ${opponent.description}. `;
  });
  return str;
}
