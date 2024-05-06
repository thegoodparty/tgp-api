// Enqueue a message to the queue to process the path to victory for a campaign.
module.exports = {
  inputs: {
    campaignId: {
      type: 'json',
      required: true,
    },
  },
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
      let { campaignId } = inputs;
      // get a fresh copy of the campaign
      const campaign = await Campaign.findOne({ id: campaignId });

      const { slug, details } = campaign;

      let queueMessage = {
        type: 'pathToVictory',
        data: {
          campaignId,
        },
      };

      if (details?.raceId) {
        let raceId = details.raceId;
        // API and AI Location Extraction is more accurate for now.
        queueMessage = await getBallotReadyApiMessage(
          queueMessage,
          campaign,
          raceId,
        );
        // }
      } else {
        const user = await User.findOne({ id: campaign.user });
        await sails.helpers.log(
          slug,
          'campaign does not have race_id. skipping p2v...',
        );
        if (user) {
          let runForOffice = campaign?.data?.details?.runForOffice || 'no';
          let knowRun = campaign?.data?.details?.knowRun || 'false';
          // only send slack message if user is running for office
          // and user did not pick an office.
          if (
            (runForOffice && runForOffice === 'yes') ||
            (knowRun && knowRun === 'true')
          ) {
            await sendVictoryIssuesSlackMessage(campaign, user);
          }
        }
        return exits.success({ message: 'ok' });
      }

      console.log('queueMessage', queueMessage);

      sails.helpers.log(slug, 'queueing Message', queueMessage);
      await sails.helpers.queue.enqueue(queueMessage);
      return exits.success({ message: 'ok' });
    } catch (e) {
      console.log('error at enqueue', e);
      await sails.helpers.slack.errorLoggerHelper('error at enqueue p2v', e);
      return exits.success({ message: 'not ok', e });
    }
  },
};

async function sendVictoryIssuesSlackMessage(campaign, user) {
  const { slug, details } = campaign;
  const { office, state, city, district } = details;
  const appBase = sails.config.custom.appBase || sails.config.appBase;

  const resolvedName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : user?.name || '/n/a';

  const slackMessage = {
    text: `Onboarding Alert!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `__________________________________ \n *Candidate did not select a standard position. * \n ${appBase}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*We need to manually add their admin Path to victory*\n
          \nName: ${resolvedName}
          \nOffice: ${office}
          \nState: ${state}
          \nCity: ${city || 'n/a'}
          \nDistrict: ${district || 'n/a'}
          \nemail: ${user.email}
          \nslug: ${slug}\n
          \nadmin link: ${appBase}/admin/victory-path/${slug}
          \n
          \n<@U01AY0VQFPE> and <@U03RY5HHYQ5>
          `,
        },
      },
    ],
  };

  await sails.helpers.slack.slackHelper(slackMessage, 'victory-issues');
}

async function getBallotReadyApiMessage(queueMessage, campaign, raceId) {
  const { details } = campaign;

  const row = await sails.helpers.ballotready.getRace(raceId);
  console.log('row', row);

  const electionDate = row?.election?.electionDay;
  // todo: maker this safer (check array length first)
  const termLength = row?.position?.electionFrequencies[0].frequency[0];
  const level = row?.position?.level.toLowerCase();
  // a simplified race level (federal, state, city)
  let electionLevel = await sails.helpers.ballotready.getRaceLevel(level);

  const officeName = row?.position?.name;
  const partisanType = row?.position?.partisanType;
  const subAreaName =
    row?.position?.subAreaName && row.position.subAreaName !== 'null'
      ? row.position.subAreaName
      : undefined;
  const subAreaValue =
    row?.position?.subAreaValue && row.position.subAreaValue !== 'null'
      ? row.position.subAreaValue
      : undefined;
  const electionState = row?.election?.state;

  const locationResp = await sails.helpers.ballotready.extractLocationAi(
    officeName + ' - ' + electionState,
    level,
  );

  let county;
  let city;
  if (locationResp?.level) {
    if (locationResp.level === 'county') {
      county = locationResp.county;
    } else {
      if (
        locationResp.county &&
        locationResp.hasOwnProperty(locationResp.level)
      ) {
        city = locationResp[locationResp.level];
        county = locationResp.county;
      }
    }
  }

  queueMessage.data.officeName = officeName;
  queueMessage.data.electionDate = electionDate;
  queueMessage.data.electionTerm = termLength;
  queueMessage.data.electionLevel = electionLevel;
  queueMessage.data.electionState = electionState;
  queueMessage.data.electionCounty = county;
  queueMessage.data.electionMunicipality = city;
  queueMessage.data.subAreaName = subAreaName;
  queueMessage.data.subAreaValue = subAreaValue;
  queueMessage.data.partisanType = partisanType;

  let priorElectionDates = [];
  if (partisanType !== 'partisan') {
    priorElectionDates = await sails.helpers.ballotready.getElectionDates(
      officeName,
      details.zip,
      details.ballotLevel,
    );
  }
  console.log('priorElectionDates', priorElectionDates);

  queueMessage.data.priorElectionDates = priorElectionDates;

  // update the Campaign details
  if (details.details) {
    await Campaign.updateOne({ id: campaign.id }).set({
      details: {
        ...details.details,
        officeTermLength: termLength ?? details.details.officeTermLength,
        electionDate: electionDate ?? details.details.electionDate,
        level: electionLevel ?? details.details.level,
        state: electionState ?? details.details.state,
        county: county ?? details.details.county,
        city: city ?? details.details.city,
        district: subAreaValue ?? details.details.district,
        partisanType: partisanType ?? details.details.partisanType,
        priorElectionDates:
          priorElectionDates ?? details.details.priorElectionDates,
      },
    });
  }

  return queueMessage;
}
