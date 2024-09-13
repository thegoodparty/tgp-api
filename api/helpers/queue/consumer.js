const { Consumer } = require('sqs-consumer');
const { SQSClient } = require('@aws-sdk/client-sqs');
const https = require('https');
const moment = require('moment');

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;
const queueUrl = sails.config.custom.queueUrl || sails.config.queueUrl;
const appBase = sails.config.custom.appBase || sails.config.appBase;

const handlePathToVictory = require('../../utils/campaign/handlePathToVictory');

let queue;

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
        const sqs = new SQSClient({
          region: 'us-west-2',
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
          httpHandlerOptions: {
            agent: new https.Agent({
              keepAlive: true,
            }),
          },
        });

        console.log('no queue instance, creating a new one');
        queue = Consumer.create({
          queueUrl,
          handleMessage: async (message) => {
            await handleMessage(message);
          },
          sqs,
        });
        queue.on('error', (err) => {
          (async () => {
            await sails.helpers.slack.errorLoggerHelper('on Queue error', {
              err,
            });
            console.error(err);
          })();
        });

        queue.on('processing_error', (err) => {
          (async () => {
            await sails.helpers.slack.errorLoggerHelper(
              'on Queue processing error',
              {
                err,
              },
            );
            console.error(err);
          })();
        });

        queue.on('stopped', () => {
          console.log('Consumer stopped running. Exiting...');
          process.exit(); // Exit the Node.js process gracefully.
        });

        queue.start();
      }

      // Continue running indefinitely
      // while (queue.isRunning) {
      //   await new Promise((resolve) => setTimeout(resolve, 1000));
      // }

      return exits.success('ok');
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Uncaught error in consumer',
        e,
      );
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
    case 'generateAiContent':
      await handleGenerateAiContent(data);
      break;
    case 'saveBallotReadyRace':
      await handleSaveBallotReadyRace(data);
      break;
    case 'pathToVictory':
      await handlePathToVictoryMessage(data);
      break;
    case 'calculateGeoLocation':
      await sails.helpers.geocoding.calculateGeoLocation();
      break;
    case 'calculateDkRoutes':
      await sails.helpers.geocoding.calculateRoutes(
        data.campaignId,
        data.dkCampaignId,
        data.maxHousesPerRoute,
      );
      break;
  }
}

async function handlePathToVictoryMessage(message) {
  try {
    const p2vResponse = await handlePathToVictory({
      ...message,
    });
    console.log('p2vResponse', p2vResponse);
    let campaignId = message.campaignId;
    let campaign = await Campaign.findOne({ id: campaignId });
    await analyzePathToVictoryResponse({ campaign, ...p2vResponse });
  } catch (e) {
    console.log('error in consumer/handlePathToVictoryMessage', e);
    await sails.helpers.slack.errorLoggerHelper(
      'error in consumer/handlePathToVictorMessagey',
      e,
    );
    // throw new Error('error in consumer/handlePathToVictoryMessage');
  }
}

async function analyzePathToVictoryResponse(p2vResponse) {
  const {
    campaign,
    pathToVictoryResponse,
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
  } = p2vResponse;

  const candidateSlackMessage = `
  • Candidate: ${campaign?.data?.name} [${campaign?.slug}]
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
      {
        title: 'Path To Victory',
        body:
          candidateSlackMessage +
          pathToVictorySlackMessage +
          turnoutSlackMessage,
      },
      'victory',
    );

    // automatically update the Campaign with the pathToVictory data.
    if (campaign.pathToVictory?.data?.p2vStatus === 'Complete') {
      console.log('Path To Victory already completed for', campaign.slug);
      await sails.helpers.slack.slackHelper(
        {
          title: 'Path To Victory',
          body: `Path To Victory already exists for ${campaign.slug}. Skipping automatic update.`,
        },
        'victory',
      );
    } else {
      // set the p2vStatus to 'Complete' and email the user.
      await completePathToVictory(campaign.slug, pathToVictoryResponse);
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
      {
        title: 'Path To Victory',
        body: candidateSlackMessage + pathToVictorySlackMessage + debugMessage,
      },
      'victory-issues',
    );
    // We now call the completePathToVictory function to update the campaign with the pathToVictory data.
    // However, in this case, it will not set the p2vStatus to 'Complete' or email the user.
    // This is because we were not able to get the turnout numbers.
    // But we still want to update the campaign with the pathToVictory data (and L2 Location for Voterfile)
    if (campaign.pathToVictory?.data?.p2vStatus !== 'Complete') {
      await completePathToVictory(campaign.slug, pathToVictoryResponse);
    }
  } else {
    let debugMessage = 'No Path To Victory Found.\n';
    if (pathToVictoryResponse) {
      debugMessage +=
        'pathToVictoryResponse: ' + JSON.stringify(pathToVictoryResponse);
    }
    await sails.helpers.slack.slackHelper(
      {
        title: 'Path To Victory',
        body: candidateSlackMessage + debugMessage,
      },
      'victory-issues',
    );

    // throw an error to requeue the SQS Task.
    // throw new Error('No Path To Victory Found');
  }
}

async function completePathToVictory(slug, pathToVictoryResponse) {
  console.log('completing path to victory for', slug);
  console.log('pathToVictoryResponse', pathToVictoryResponse);
  try {
    const campaign = await Campaign.findOne({ slug }).populate('user');
    const { user } = campaign;

    let p2v = await PathToVictory.findOne({ campaign: campaign.id });

    if (!p2v) {
      p2v = await PathToVictory.create({ campaign: campaign.id }).fetch();
      await Campaign.updateOne({ id: campaign.id }).set({
        pathToVictory: p2v.id,
      });
    } else if (!campaign.pathToVictory) {
      await Campaign.updateOne({ id: campaign.id }).set({
        pathToVictory: p2v.id,
      });
    }

    let p2vStatus = 'Waiting';
    if (
      pathToVictoryResponse?.counts?.total &&
      pathToVictoryResponse.counts.total > 0 &&
      pathToVictoryResponse.counts.projectedTurnout > 0
    ) {
      p2vStatus = 'Complete';
    }

    const p2vData = p2v.data || {};
    await PathToVictory.updateOne({
      id: p2v.id,
    }).set({
      data: {
        ...p2vData,
        totalRegisteredVoters: pathToVictoryResponse.counts.total,
        republicans: pathToVictoryResponse.counts.republican,
        democrats: pathToVictoryResponse.counts.democrat,
        indies: pathToVictoryResponse.counts.independent,
        averageTurnout: pathToVictoryResponse.counts.averageTurnout,
        projectedTurnout: pathToVictoryResponse.counts.projectedTurnout,
        winNumber: pathToVictoryResponse.counts.winNumber,
        voterContactGoal: pathToVictoryResponse.counts.voterContactGoal,
        electionType: pathToVictoryResponse.electionType,
        electionLocation: pathToVictoryResponse.electionLocation,
        p2vCompleteDate: moment().format('YYYY-MM-DD'),
        p2vStatus,
      },
    });

    if (p2vStatus === 'Complete') {
      let name;
      if (user) {
        name = await sails.helpers.user.name(user);
      } else {
        console.log('no user found for campaign', slug);
      }
      const variables = JSON.stringify({
        name: name ? name : 'Friend',
        link: `${appBase}/dashboard`,
      });

      if (appBase === 'https://goodparty.org') {
        console.log('sending email to user', user.email);
        await sails.helpers.mailgun.mailgunTemplateSender(
          user.email,
          'Exciting News: Your Customized Campaign Plan is Updated!',
          'candidate-victory-ready',
          variables,
          'jared@goodparty.org',
        );
      }
    }
  } catch (e) {
    console.log('error updating campaign', e);
  }
}

async function handleGenerateAiContent(message) {
  const { slug, key, regenerate } = message;

  let campaign = await Campaign.findOne({ slug });
  let aiContent = campaign?.aiContent;
  let prompt = aiContent.generationStatus[key]?.prompt;
  let existingChat = aiContent.generationStatus[key]?.existingChat;
  let inputValues = aiContent.generationStatus[key]?.inputValues;

  if (!aiContent || !prompt) {
    await sails.helpers.slack.slackHelper(
      {
        title: 'Error generating ai content',
        body: `Error generating ai content. slug: ${slug}, key: ${key}, regenerate: ${regenerate}. campaignId: ${
          campaign?.id
        }. message: ${JSON.stringify(message)}`,
      },
      'dev',
    );
    // throw new Error(`error generating ai content. slug: ${slug}, key: ${key}`);
  } else {
    let chat = existingChat || [];
    let messages = [{ role: 'user', content: prompt }, ...chat];
    let chatResponse;

    let generateError = false;

    try {
      await sails.helpers.slack.aiLoggerHelper(
        'handling campaign from queue',
        message,
      );

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

      // TODO: investigate if there is a way to get token usage with langchain.
      // const totalTokens = 0;

      await sails.helpers.slack.aiLoggerHelper(
        `[ ${slug} - ${key} ] Generation Complete. Tokens Used:`,
        totalTokens,
      );

      campaign = await Campaign.findOne({ slug });
      aiContent = campaign.aiContent;
      let oldVersion;
      if (chatResponse && chatResponse !== '') {
        try {
          let oldVersionData = aiContent[key];
          oldVersion = {
            // todo: try to convert oldVersionData.updatedAt to a date object.
            date: new Date().toString(),
            text: oldVersionData.content,
          };
        } catch (e) {
          // dont warn because this is expected to fail sometimes.
          // console.log('error getting old version', e);
        }
        aiContent[key] = {
          name: camelToSentence(key), // todo: check if this overwrites a name they've chosen.
          updatedAt: new Date().valueOf(),
          inputValues,
          content: chatResponse,
        };

        console.log('saving campaign version', key);
        console.log('inputValues', inputValues);
        console.log('oldVersion', oldVersion);

        await sails.helpers.ai.saveCampaignVersion(
          aiContent,
          key,
          campaign.id,
          inputValues,
          oldVersion,
          regenerate ? regenerate : false,
        );

        if (
          !aiContent?.generationStatus ||
          typeof aiContent.generationStatus !== 'object'
        ) {
          aiContent.generationStatus = {};
        }
        if (
          !aiContent?.generationStatus[key] ||
          typeof aiContent.generationStatus[key] !== 'object'
        ) {
          aiContent.generationStatus[key] = {};
        }

        aiContent.generationStatus[key].status = 'completed';

        await Campaign.updateOne({
          slug,
        }).set({
          aiContent,
        });

        await sails.helpers.slack.aiLoggerHelper(
          `updated campaign with ai. chatResponse: key: ${key}`,
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
        if (!aiContent?.campaignPlanAttempts) {
          aiContent.campaignPlanAttempts = {};
        }
        if (!aiContent?.campaignPlanAttempts[key]) {
          aiContent.campaignPlanAttempts[key] = 1;
        }
        aiContent.campaignPlanAttempts[key] = aiContent?.campaignPlanAttempts[
          key
        ]
          ? aiContent.campaignPlanAttempts[key] + 1
          : 1;

        await sails.helpers.slack.aiLoggerHelper(
          'Current Attempts:',
          aiContent.campaignPlanAttempts[key],
        );

        // After 3 attempts, we give up.
        if (
          aiContent?.generationStatus[key]?.status &&
          aiContent.generationStatus[key].status !== 'completed'
        ) {
          if (aiContent.campaignPlanAttempts[key] >= 3) {
            await sails.helpers.slack.aiLoggerHelper(
              'Deleting generationStatus for key',
              key,
            );
            delete aiContent.generationStatus[key];
          }
        }
        await Campaign.updateOne({
          slug,
        }).set({
          aiContent,
        });
      } catch (e) {
        await sails.helpers.slack.aiLoggerHelper(
          'Error at consumer updating campaign with ai.',
          key,
          e,
        );
        await sails.helpers.slack.errorLoggerHelper(
          'Error at consumer updating campaign with ai.',
          key,
          e,
        );
        console.log('error at consumer', e);
      }
      // throw an Error so that the message goes back to the queue or the DLQ.
      // throw new Error(`error generating ai content. slug: ${slug}, key: ${key}`);
    }
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
