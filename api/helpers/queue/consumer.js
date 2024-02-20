const { Consumer } = require('sqs-consumer');
const AWS = require('aws-sdk');
const https = require('https');
const moment = require('moment');

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;
const queueUrl = sails.config.custom.queueUrl || sails.config.queueUrl;
const appBase = sails.config.custom.appBase || sails.config.appBase;

let queue;
AWS.config.update({
  region: 'eu-west-2',
  accessKeyId,
  secretAccessKey,
});

module.exports = {
  inputs: {},
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    try {
      if (!queueUrl) {
        return exits.success('not ok');
      }
      if (!queue) {
        console.log('no queue instance, creating a new one');
        queue = Consumer.create({
          queueUrl,
          handleMessage: async (message) => {
            await handleMessage(message);
          },
          sqs: new AWS.SQS({
            httpOptions: {
              agent: new https.Agent({
                keepAlive: true,
              }),
            },
          }),
        });
        queue.on('error', (err) => {
          console.error(err.message);
        });

        queue.on('processing_error', (err) => {
          console.error(err.message);
        });

        queue.start();
      }
      return exits.success('ok');
    } catch (e) {
      return exits.success('not ok');
    }
  },
};

const camelToSentence = (text) => {
  const result = text.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

async function handleMessage(message) {
  // console.log(`consumer received message: ${message.Body}`);
  if (!message) {
    return;
  }
  const body = message.Body;
  if (!body) {
    return;
  }
  const action = JSON.parse(body);
  const { type, data } = action;
  console.log('processing queue message type ', type);
  switch (type) {
    case 'generateCampaignPlan':
      await handleGenerateCampaignPlan(data);
      break;
    case 'saveBallotReadyRace':
      await handleSaveBallotReadyRace(data);
      break;
    case 'pathToVictory':
      await handlePathToVictory(data);
      break;
  }
}

async function handlePathToVictory(message) {
  //create or update each election and position
  let {
    campaignId,
    officeName,
    electionDate,
    electionTerm,
    electionLevel,
    electionState,
    electionCounty,
    electionMunicipality,
    subAreaName,
    subAreaValue,
    partisanType,
  } = message;

  let pathToVictoryResponse = {
    electionType: '',
    electionLocation: '',
    district: '',
    counts: {
      total: 0,
      democrat: 0,
      republican: 0,
      independent: 0,
    },
  };

  let campaign;
  try {
    campaign = await Campaign.findOne({ id: campaignId });
  } catch (e) {
    console.log('error getting campaign', e);
  }
  if (!campaign) {
    console.log('error: no campaign found');
    return;
  }
  let slug = campaign.slug;
  // sails.helpers.log(slug, 'campaign', campaign);
  sails.helpers.log(slug, 'handling p2v message', message);

  try {
    const officeResponse = await sails.helpers.campaign.officeHelper(
      officeName,
      electionLevel,
      electionState,
      electionCounty,
      electionMunicipality,
      subAreaName,
      subAreaValue,
    );

    sails.helpers.log(slug, 'finished calling officeHelper');

    // sails.helpers.log(slug, 'officeResponse', officeResponse);
    sails.helpers.log(slug, 'officeResponse', officeResponse);

    if (officeResponse) {
      const { electionTypes, electionDistricts } = officeResponse;

      if (electionTypes && electionTypes.length > 0) {
        for (let electionType of electionTypes) {
          // for now we only try the top district in the list.
          let district;
          sails.helpers.log(
            slug,
            `checking if electionDistricts has ${electionType}`,
          );
          let electionTypeName = electionType.column;
          if (
            electionDistricts &&
            electionDistricts.hasOwnProperty(electionTypeName) &&
            electionDistricts[electionTypeName].length > 0
          ) {
            district = electionDistricts[electionTypeName][0].value;
            electionType = electionDistricts[electionTypeName][0];
          }
          sails.helpers.log(slug, 'district', district);
          sails.helpers.log(slug, 'electionType', electionType);

          if (officeName === 'President of the United States') {
            // special case for President.
            electionState = 'US';
          }

          const counts = await sails.helpers.campaign.countHelper(
            electionTerm,
            electionDate ? electionDate : new Date().toISOString().slice(0, 10),
            electionState,
            electionType.column,
            electionType.value,
            district,
            partisanType,
          );

          sails.helpers.log(slug, 'counts', counts);

          if (counts && counts?.total && counts.total > 0) {
            pathToVictoryResponse.electionType = electionType.column;
            pathToVictoryResponse.electionLocation = electionType.value;
            pathToVictoryResponse.electionDistrict = district;
            pathToVictoryResponse.counts = counts;

            try {
              const existingObj = await l2Count.findOne({
                electionType: electionType.column,
                electionLocation: electionType.value,
                electionDistrict: district,
              });
              if (existingObj) {
                await l2Count
                  .updateOne({
                    electionType: electionType.column,
                    electionLocation: electionType.value,
                    electionDistrict: district,
                  })
                  .set({
                    counts: counts,
                  });
              } else {
                await l2Count.create({
                  electionType: electionType.column,
                  electionLocation: electionType.value,
                  electionDistrict: district,
                  counts: counts,
                });
              }
            } catch (e) {
              console.log('error saving l2Count', e);
            }

            break;
          }
        }
      }
    }

    console.log('preparing p2v messages');

    const candidateSlackMessage = `
    • Candidate: ${campaign.data.name} [${campaign.slug}]
    • Office: ${officeName}
    • Election Date: ${electionDate}
    • Election Term: ${electionTerm}
    • Election Level: ${electionLevel}
    • Election State: ${electionState}
    • Election County: ${electionCounty}
    • Election Municipality: ${electionMunicipality}
    • Sub Area Name: ${subAreaName}
    • Sub Area Value: ${subAreaValue}
    • Partisan Type: ${partisanType}
    `;

    const pathToVictorySlackMessage = `
    ￮ L2 Election Type: ${pathToVictoryResponse.electionType}
    ￮ L2 Location: ${pathToVictoryResponse.electionLocation}
    ￮ Total Voters: ${pathToVictoryResponse.counts.total}
    ￮ Democrats: ${pathToVictoryResponse.counts.democrat}
    ￮ Republicans: ${pathToVictoryResponse.counts.republican}
    ￮ Independents: ${pathToVictoryResponse.counts.independent}
    `;

    // Alert Jared and Rob.
    const alertSlackMessage = `
    <@U01AY0VQFPE> and <@U03RY5HHYQ5>
    `;

    if (
      pathToVictoryResponse?.electionType &&
      pathToVictoryResponse?.counts?.total &&
      pathToVictoryResponse.counts.total > 0 &&
      pathToVictoryResponse.counts.projectedTurnout > 0
    ) {
      const turnoutSlackMessage = `
      ￮ Average Turnout %: ${pathToVictoryResponse.counts.averageTurnoutPercent}
      ￮ Projected Turnout: ${pathToVictoryResponse.counts.projectedTurnout}
      ￮ Projected Turnout %: ${pathToVictoryResponse.counts.projectedTurnoutPercent}
      ￮ Win Number: ${pathToVictoryResponse.counts.winNumber}
      ￮ Voter Contact Goal: ${pathToVictoryResponse.counts.voterContactGoal}
      `;

      await sails.helpers.slack.slackHelper(
        simpleSlackMessage(
          'Path To Victory',
          candidateSlackMessage +
            pathToVictorySlackMessage +
            turnoutSlackMessage +
            alertSlackMessage,
        ),
        'victory',
      );

      // automatically update the Campaign with the pathToVictory data.
      if (campaign.data?.pathToVictory) {
        await sails.helpers.slack.slackHelper(
          simpleSlackMessage(
            'Path To Victory',
            `Path To Victory already exists for ${campaign.slug}. Skipping automatic update.`,
          ),
          'victory',
        );
      } else {
        // refetch the Campaign object to make sure we have the latest data.
        // and prevent race conditions.
        try {
          campaign = await Campaign.findOne({ id: campaignId });

          await Campaign.updateOne({
            id: campaign.id,
          }).set({
            data: {
              ...campaign.data,
              pathToVictory: {
                totalRegisteredVoters: pathToVictoryResponse.counts.total,
                republicans: pathToVictoryResponse.counts.republican,
                democrats: pathToVictoryResponse.counts.democrat,
                indies: pathToVictoryResponse.counts.independent,
                averageTurnout: pathToVictoryResponse.counts.averageTurnout,
                projectedTurnout: pathToVictoryResponse.counts.projectedTurnout,
                winNumber: pathToVictoryResponse.counts.winNumber,
                voterContactGoal: pathToVictoryResponse.counts.voterContactGoal,
              },
            },
          });
        } catch (e) {
          console.log('error getting campaign', e);
        }

        // set the p2vStatus to 'Complete' and email the user.
        await completePathToVictory(slug);
      }
    } else if (
      pathToVictoryResponse?.electionType &&
      pathToVictoryResponse?.counts?.total &&
      pathToVictoryResponse.counts.total > 0
    ) {
      // Was not able to get the turnout numbers.
      // TODO: possibly add more debug info here. Which election dates did we try to get turnout numbers for?
      const debugMessage = 'Was not able to get the turnout numbers.\n';
      await sails.helpers.slack.slackHelper(
        simpleSlackMessage(
          'Path To Victory',
          candidateSlackMessage +
            pathToVictorySlackMessage +
            debugMessage +
            alertSlackMessage,
        ),
        'victory-issues',
      );
    } else {
      let debugMessage = 'No Path To Victory Found.\n';
      if (officeResponse) {
        debugMessage += 'Developer/Debug Data:\n';
        debugMessage += 'officeResponse: ' + JSON.stringify(officeResponse);
      }
      if (pathToVictoryResponse) {
        debugMessage +=
          'pathToVictoryResponse: ' + JSON.stringify(pathToVictoryResponse);
      }
      await sails.helpers.slack.slackHelper(
        simpleSlackMessage(
          'Path To Victory',
          candidateSlackMessage + debugMessage + alertSlackMessage,
        ),
        'victory-issues',
      );
    }
  } catch (e) {
    sails.helpers.log(slug, 'error in consumer/handlePathToVictory', e);
  }
}

async function completePathToVictory(slug) {
  const campaign = await Campaign.findOne({ slug }).populate('user');
  const { user } = campaign;
  const name = await sails.helpers.user.name(user);
  const variables = JSON.stringify({
    name,
    link: `${appBase}/dashboard`,
  });
  await Campaign.updateOne({ slug }).set({
    data: {
      ...campaign.data,
      p2vCompleteDate: moment().format('YYYY-MM-DD'),
      p2vStatus: 'Complete',
    },
  });

  await sails.helpers.mailgun.mailgunTemplateSender(
    user.email,
    'Exciting News: Your Customized Campaign Plan is Updated!',
    'candidate-victory-ready',
    variables,
    'jared@goodparty.org',
  );
}

function simpleSlackMessage(text, body) {
  return {
    text,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: body,
        },
      },
    ],
  };
}

async function handleGenerateCampaignPlan(message) {
  const { prompt, slug, subSectionKey, key, existingChat, inputValues } =
    message;
  let chat = existingChat || [];
  let messages = [{ role: 'user', content: prompt }, ...chat];
  let campaign;
  let data;
  let chatResponse;

  let generateError = false;

  try {
    await sails.helpers.slack.aiLoggerHelper(
      'handling campaign from queue',
      message,
    );

    campaign = await Campaign.findOne({ slug });
    data = campaign.data;

    let maxTokens = 2000;
    if (existingChat && existingChat.length > 0) {
      maxTokens = 2500;
    }

    let completion = await sails.helpers.ai.createCompletion(
      messages,
      maxTokens,
      0.7,
      0.9,
    );
    // console.log('completion', completion);
    chatResponse = completion.content;
    const totalTokens = completion.tokens;

    // const prompt = messages.map((message) => message.content).join('\n');
    // chatResponse = await sails.helpers.ai.langchainCompletion(prompt);
    // chatResponse = chatResponse.replace('/n', '<br/><br/>');

    console.log('chatResponse', chatResponse);
    // TODO: investigate if there is a way to get token usage with langchain.
    // const totalTokens = 0;

    await sails.helpers.slack.aiLoggerHelper(
      `[ ${slug} - ${key} ] Generation Complete. Tokens Used:`,
      totalTokens,
    );

    campaign = await Campaign.findOne({ slug });
    data = campaign.data;
    let oldVersion;
    if (chatResponse && chatResponse !== '') {
      if (subSectionKey === 'aiContent') {
        try {
          let oldVersionData = data[subSectionKey][key];
          oldVersion = {
            // todo: try to convert oldVersionData.updatedAt to a date object.
            date: new Date().toString(),
            text: oldVersionData.content,
          };
        } catch (e) {
          // dont warn because this is expected to fail sometimes.
          // console.log('error getting old version', e);
        }
        data[subSectionKey][key] = {
          name: camelToSentence(key), // todo: check if this overwrites a name they've chosen.
          updatedAt: new Date().valueOf(),
          inputValues,
          content: chatResponse,
        };
      } else {
        data[subSectionKey][key] = chatResponse;
      }

      await sails.helpers.ai.saveCampaignVersion(
        data,
        subSectionKey,
        key,
        campaign.id,
        inputValues,
        oldVersion,
      );

      if (
        !data?.campaignPlanStatus ||
        typeof data.campaignPlanStatus !== 'object'
      ) {
        data.campaignPlanStatus = {};
      }
      if (
        !data?.campaignPlanStatus[key] ||
        typeof data.campaignPlanStatus[key] !== 'object'
      ) {
        data.campaignPlanStatus[key] = {};
      }

      data.campaignPlanStatus[key].status = 'completed';
      await Campaign.updateOne({
        slug,
      }).set({
        data,
      });
      await sails.helpers.slack.aiLoggerHelper(
        `updated campaign with ai. chatResponse: subSectionKey: ${subSectionKey}. key: ${key}`,
        chatResponse,
      );
    }
  } catch (e) {
    console.log('error at consumer', e);
    console.log('messages', messages);
    generateError = true;

    if (e.data) {
      await sails.helpers.slack.errorLoggerHelper(
        'error at AI queue consumer (with msg): ',
        e.data.error,
      );
      await sails.helpers.slack.aiLoggerHelper(
        'error at AI queue consumer (with msg): ',
        e.data.error,
      );
      console.log('error', e.data.error);
    } else {
      await sails.helpers.slack.errorLoggerHelper(
        'error at AI queue consumer. Queue Message: ',
        message,
      );
      await sails.helpers.slack.errorLoggerHelper(
        'error at AI queue consumer debug: ',
        e,
      );
      await sails.helpers.slack.aiLoggerHelper(
        'error at AI queue consumer debug: ',
        e,
      );
    }
  }

  // Failed to generate content.
  if (!chatResponse || chatResponse === '' || generateError) {
    try {
      // if data does not have key campaignPlanAttempts
      if (!data?.campaignPlanAttempts) {
        data.campaignPlanAttempts = {};
      }
      if (!data?.campaignPlanAttempts[key]) {
        data.campaignPlanAttempts[key] = 1;
      }
      data.campaignPlanAttempts[key] = data?.campaignPlanAttempts[key]
        ? data.campaignPlanAttempts[key] + 1
        : 1;

      await sails.helpers.slack.aiLoggerHelper(
        'Current Attempts:',
        data.campaignPlanAttempts[key],
      );

      // After 3 attempts, we give up.
      if (
        data?.campaignPlanStatus[key]?.status &&
        data.campaignPlanStatus[key].status !== 'completed'
      ) {
        if (data.campaignPlanAttempts[key] >= 3) {
          await sails.helpers.slack.aiLoggerHelper(
            'Deleting campaignPlanStatus for key',
            key,
          );
          delete data.campaignPlanStatus[key];
        }
      }
      await Campaign.updateOne({
        slug,
      }).set({
        data,
      });
    } catch (e) {
      console.log('error at consumer', e);
    }
    // throw an Error so that the message goes back to the queue or the DLQ.
    throw new Error('error generating ai content');
  }
}

async function handleSaveBallotReadyRace(race) {
  console.log('handleing races in queue consumer');
  //create or update each election and position
  try {
    const node = race.node;
    const positionId = node.position?.id;
    const electionId = node.election?.id;

    const existingRecord = await BallotElection.findOne({
      ballotId: electionId,
    });
    if (existingRecord) {
      await BallotElection.updateOne({ ballotId: electionId }).set({
        electionDate: new Date(node.election.electionDay).getTime(),
        state: node.election.state,
        data: node.election,
      });
    } else {
      await BallotElection.create({
        ballotId: electionId,
        electionDate: new Date(node.election.electionDay).getTime(),
        state: node.election.state,
        data: node.election,
      });
    }

    const existingPosition = await BallotPosition.findOne({
      ballotId: positionId,
    });
    if (existingPosition) {
      await BallotPosition.updateOne({ ballotId: positionId }).set({
        data: node.position,
      });
    } else {
      await BallotPosition.create({
        ballotId: positionId,
        data: node.election,
      });
    }
  } catch (e) {
    console.log('error in consumer/handleSaveBallotReadyRaces', e);
  }
}
