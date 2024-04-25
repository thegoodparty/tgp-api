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

      const user = await User.findOne({ id: campaign.user });

      const name = `${user.firstName} ${user.lastName}`;

      const positionsStr = positionsToStr(
        campaignPositions,
        campaign.details.customIssues,
      );
      let party =
        campaign.details?.party === 'Other'
          ? campaign.details.otherParty
          : campaign.details?.party;
      if (party === 'Independent') {
        party = 'Independent / non-partisan';
      }
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
          find: 'website',
          replace: campaign.details.website,
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
          find: 'primaryElectionDate',
          replace: campaign.details.primaryElectionDate,
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
          replace: campaign.details.campaignCommittee || 'unknown',
        },
      ];
      const againstStr = againstToStr(campaign.details.runningAgainst);
      replaceArr.push(
        {
          find: 'runningAgainst',
          replace: againstStr,
        },
        {
          find: 'electionDate',
          replace: campaign.details.electionDate,
        },
        {
          find: 'statementName',
          replace: campaign.details.statementName,
        },
      );
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
      if (campaign.campaignPlan) {
        const {
          aboutMe,
          communicationStrategy,
          messageBox,
          mobilizing,
          policyPlatform,
          slogan,
          why,
        } = campaign.campaignPlan;
        replaceArr.push(
          {
            find: 'slogan',
            replace: slogan,
          },
          {
            find: 'why',
            replace: why,
          },
          {
            find: 'about',
            replace: aboutMe,
          },
          {
            find: 'myPolicies',
            replace: policyPlatform,
          },
          {
            find: 'commStart',
            replace: communicationStrategy,
          },
          {
            find: 'mobilizing',
            replace: mobilizing,
          },
          {
            find: 'positioning',
            replace: messageBox,
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
