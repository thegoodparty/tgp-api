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
      outputDescription: 'Campaign Found',
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
      const details = campaign.details || {};

      const positionsStr = positionsToStr(
        campaignPositions,
        details.customIssues,
      );
      let party =
        details.party === 'Other' ? details.otherParty : details?.party;
      if (party === 'Independent') {
        party = 'Independent / non-partisan';
      }
      const office =
        details.office === 'Other' ? details.otherOffice : details?.office;

      const replaceArr = [
        {
          find: 'name',
          replace: name,
        },
        {
          find: 'zip',
          replace: details.zip,
        },
        {
          find: 'website',
          replace: details.website,
        },
        {
          find: 'party',
          replace: party,
        },
        {
          find: 'state',
          replace: details.state,
        },
        {
          find: 'primaryElectionDate',
          replace: details.primaryElectionDate,
        },
        {
          find: 'district',
          replace: details.district,
        },
        {
          find: 'office',
          replace: `${office}${
            details.district ? ` in ${details.district}` : ''
          }`,
        },
        {
          find: 'positions',
          replace: positionsStr,
        },
        {
          find: 'pastExperience',
          replace:
            typeof details.pastExperience === 'string'
              ? details.pastExperience
              : JSON.stringify(details.pastExperience || {}),
        },
        {
          find: 'occupation',
          replace: details.occupation,
        },
        {
          find: 'funFact',
          replace: details.funFact,
        },
        {
          find: 'campaignCommittee',
          replace: details.campaignCommittee || 'unknown',
        },
      ];
      const againstStr = againstToStr(details.runningAgainst);
      replaceArr.push(
        {
          find: 'runningAgainst',
          replace: againstStr,
        },
        {
          find: 'electionDate',
          replace: details.electionDate,
        },
        {
          find: 'statementName',
          replace: details.statementName,
        },
      );

      if (campaign.pathToVictory) {
        const pathToVictory = await PathToVictory.findOne({
          campaign: campaign.id,
        });

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
        } = pathToVictory.data;
        replaceArr.push(
          {
            find: 'pathToVictory',
            replace: JSON.stringify(pathToVictory.data),
          },
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

      if (newPrompt.includes('[[updateHistory]]')) {
        const updateHistoryObjects = await CampaignUpdateHistory.find({
          campaign: campaign.id,
        });

        const twoWeeksAgo = new Date();
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        let updateHistory = {
          allTime: {
            total: 0,
            doorKnocking: 0,
            digital: 0,
            calls: 0,
            yardSigns: 0,
            events: 0,
            text: 0,
            directMail: 0,
          },
          thisWeek: {
            total: 0,
            doorKnocking: 0,
            digital: 0,
            calls: 0,
            yardSigns: 0,
            events: 0,
            text: 0,
            directMail: 0,
          },
          lastWeek: {
            total: 0,
            doorKnocking: 0,
            digital: 0,
            calls: 0,
            yardSigns: 0,
            events: 0,
            text: 0,
            directMail: 0,
          },
        };

        if (updateHistoryObjects) {
          for (const update of updateHistoryObjects) {
            updateHistory.allTime[update.type] += update.quantity;
            if (update.createdAt > thisWeek) {
              updateHistory.thisWeek[update.type] += update.quantity;
            }
            if (update.createdAt > twoWeeksAgo && update.createdAt < thisWeek) {
              updateHistory.lastWeek[update.type] += update.quantity;
            }
          }
        }
        replaceArr.push({
          find: 'updateHistory',
          replace: JSON.stringify(updateHistory),
        });
      }

      if (campaign.aiContent) {
        const {
          aboutMe,
          communicationStrategy,
          messageBox,
          mobilizing,
          policyPlatform,
          slogan,
          why,
        } = campaign.aiContent;
        replaceArr.push(
          {
            find: 'slogan',
            replace: slogan?.content,
          },
          {
            find: 'why',
            replace: why?.content,
          },
          {
            find: 'about',
            replace: aboutMe?.content,
          },
          {
            find: 'myPolicies',
            replace: policyPlatform?.content,
          },
          {
            find: 'commStart',
            replace: communicationStrategy?.content,
          },
          {
            find: 'mobilizing',
            replace: mobilizing?.content,
          },
          {
            find: 'positioning',
            replace: messageBox?.content,
          },
        );
      }

      replaceArr.forEach((item) => {
        try {
          newPrompt = replaceAll(
            newPrompt,
            item.find,
            item.replace ? item.replace.toString().trim() : '',
          );
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
    if (position || topIssue) {
      str += `Issue #${i + 1}: ${topIssue?.name}. Position on the issue: ${
        position?.name
      }. Candidate's position: ${campaignPosition?.description}. `;
    }
  });

  if (customIssues) {
    customIssues.forEach((issue) => {
      str += `${issue?.title} - ${issue?.position}, `;
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
