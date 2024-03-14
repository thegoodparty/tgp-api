// Enqueue a message to the queue to process the path to victory for a campaign.
module.exports = {
  inputs: {
    campaign: {
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
      // TODO: add this back when we go to production.
      // if (appBase !== 'https://goodparty.org') {
      //   return;
      // }
      const { campaign } = inputs;
      const { data, slug } = campaign;
      const { details } = data;

      let queueMessage = {
        type: 'pathToVictory',
        data: {
          campaignId: campaign.id,
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
        // This method was not accurate enough and was deprecated.
        // queueMessage = await getCampaignDbMessage(queueMessage, campaign);
        const user = await User.findOne({ id: campaign.user });
        await sails.helpers.log(
          slug,
          'campaign does not have race_id. skipping p2v...',
        );
        await sendVictoryIssuesSlackMessage(campaign, user);
        return exits.success({ message: 'ok' });
      }

      console.log('queueMessage', queueMessage);

      sails.helpers.log(slug, 'queueing Message', queueMessage);
      await sails.helpers.queue.enqueue(queueMessage);
      return exits.success({ message: 'ok' });
    } catch (e) {
      console.log('error at enqueue', e);
      return exits.success({ message: 'not ok', e });
    }
  },
};

async function sendVictoryIssuesSlackMessage(campaign, user) {
  const { data, slug } = campaign;
  const { details } = data;
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

async function getCampaignDbMessage(queueMessage, campaign) {
  const { data } = campaign;
  const { details } = data;
  const { office, state, city, district, officeTermLength, otherOffice } =
    details;

  let goals = data?.goals;
  let electionDate = goals?.electionDate;
  let electionLevel = 'city';
  if (
    office.toLowerCase().includes('senate') ||
    office.toLowerCase().includes('house')
  ) {
    electionLevel = 'state';
  } else if (office.toLowerCase().includes('county')) {
    electionLevel = 'county';
  } else if (
    office.toLowerCase().includes('congress') ||
    office.toLowerCase().includes('president')
  ) {
    electionLevel = 'federal';
  }

  let termLength = 0;
  // extract the number from the officeTermLength string
  if (officeTermLength) {
    termLength = officeTermLength.match(/\d+/)[0].toString();
  }

  let officeName = office;
  if (officeName === 'Other') {
    officeName = otherOffice;
  }
  queueMessage.data.officeName = officeName;
  queueMessage.data.electionDate = electionDate;
  queueMessage.data.electionTerm = termLength;
  queueMessage.data.electionLevel = electionLevel;
  queueMessage.data.electionState = state;
  queueMessage.data.electionCounty = '';
  queueMessage.data.electionMunicipality = city;
  queueMessage.data.subAreaName = district ? 'district' : undefined;
  queueMessage.data.subAreaValue = district;
  return queueMessage;
}

async function getBallotReadyApiMessage(queueMessage, campaign, raceId) {
  const { data } = campaign;

  const row = await getRaceById(raceId);
  console.log('row', row);

  const officeName = row?.position?.name;
  const locationData = await sails.helpers.ballotready.extractLocationAi(
    officeName,
  );

  // extractLocation was deprecated in favor of extractLocationAi
  // const locationData = {
  //   position_name: row?.position?.name,
  //   state: row?.position?.state,
  //   level: row?.position?.level,
  // };
  // const { name, level } = await sails.helpers.ballotready.extractLocation(
  //   locationData,
  // );

  const electionDate = row?.election?.electionDay;
  // todo: maker this safer (check array length first)
  const termLength = row?.position?.electionFrequencies[0].frequency[0];
  const level = row?.position?.level.toLowerCase();
  let electionLevel = getRaceLevel(level);
  if (electionLevel === 'city' && locationData?.county) {
    // because 'local' is recoded as city.
    // if the ai extracts a county, then we should use that.
    electionLevel = 'county';
  }
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
  queueMessage.data.officeName = officeName;
  queueMessage.data.electionDate = electionDate;
  queueMessage.data.electionTerm = termLength;
  queueMessage.data.electionLevel = electionLevel;
  queueMessage.data.electionState = electionState;
  queueMessage.data.electionCounty = locationData?.county
    ? locationData.county
    : undefined;
  queueMessage.data.electionMunicipality = locationData?.city
    ? locationData.city
    : undefined;
  queueMessage.data.subAreaName = subAreaName;
  queueMessage.data.subAreaValue = subAreaValue;
  queueMessage.data.partisanType = partisanType;

  let priorElectionDates = [];
  if (partisanType !== 'partisan') {
    priorElectionDates = await sails.helpers.ballotready.getElectionDates(
      officeName,
      data.details.zip,
      data.details.ballotLevel,
    );
  }
  console.log('priorElectionDates', priorElectionDates);

  queueMessage.data.priorElectionDates = priorElectionDates;

  // update the Campaign details
  if (data.details) {
    await Campaign.updateOne({ id: campaign.id }).set({
      data: {
        ...data,
        details: {
          ...data.details,
          officeTermLength: termLength ?? data.details.officeTermLength,
          electionDate: electionDate ?? data.details.electionDate,
          level: electionLevel ?? data.details.level,
          state: electionState ?? data.details.state,
          county: locationData?.county ?? data.details.county,
          city: locationData?.city ?? data.details.city,
          district: subAreaValue ?? data.details.district,
          partisanType: partisanType ?? data.details.partisanType,
          priorElectionDates:
            priorElectionDates ?? data.details.priorElectionDates,
        },
      },
    });
  }

  return queueMessage;
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

async function getBallotReadyDbMessage(queueMessage, campaign, raceId) {
  let ballotRace;
  console.log('raceId', raceId);
  // if raceId is numeric. test it using a regex. since its a string.
  let dbRaceId;
  if (!raceId.match(/^\d+$/)) {
    dbRaceId = await getRaceDatabaseId(raceId);
    console.log('determined dbRaceId', dbRaceId);
  }
  ballotRace = await BallotRace.findOne({
    ballotId: dbRaceId.toString(),
  });
  if (ballotRace) {
    console.log('found ballotRace in database');
    queueMessage = await getBallotReadyDbMessage(
      queueMessage,
      campaign,
      ballotRace,
    );
  } else {
    console.log('ballotRace not found in database. getting data from api');
  }

  if (ballotRace.data?.frequency) {
    termData = ballotRace.data.frequency;
    const pattern = /\[(\d+)[^\d]?/;
    const match = termData.match(pattern);
    const term = match[1];
    console.log('Found term', term);
    if (match) {
      queueMessage.data.electionTerm = term;
      campaign.data.details.officeTermLength = term;
    }
  }
  if (ballotRace.data?.election_day) {
    queueMessage.data.electionDate = ballotRace.data.election_day;
    if (campaign.data.details.electionDate) {
      campaign.data.details.electionDate = ballotRace.data.election_day;
    }
  }

  if (ballotRace?.level) {
    queueMessage.data.electionLevel = ballotRace.level;
    campaign.data.details.level = ballotRace.level;
  }
  console.log('ballotRace.data?.partisan_type', ballotRace.data?.partisan_type);
  if (ballotRace.data?.partisan_type) {
    queueMessage.data.partisanType = ballotRace.data.partisan_type;
    campaign.data.details.partisanType = ballotRace.data.partisan_type;
  }
  let subAreaName;
  let subAreaValue;
  if (ballotRace.data.sub_area_name) {
    subAreaName = ballotRace.data.sub_area_name;
    subAreaValue = ballotRace.data.sub_area_value;
  } else if (ballotRace.data.sub_area_name_secondary) {
    subAreaName = ballotRace.data.sub_area_name_secondary;
    subAreaValue = ballotRace.data.sub_area_value_secondary;
  }
  queueMessage.data.officeName = ballotRace.data.position_name;
  queueMessage.data.electionState = ballotRace.state;
  queueMessage.data.electionCounty = ballotRace.county;
  queueMessage.data.electionMunicipality = ballotRace.municipality;
  queueMessage.data.subAreaName = subAreaName;
  queueMessage.data.subAreaValue = subAreaValue;

  // update the Campaign details
  await Campaign.updateOne({ id: campaign.id }).set({
    data: campaign.data,
  });

  return queueMessage;
}

function getRaceLevel(level) {
  // "level"
  // "city"
  // "county"
  // "federal"
  // "local"
  // "regional"
  // "state"
  // "town"
  // "township"
  // "village"
  // TODO: it might be advantageous to distinguish city from town, township, and village
  // But for now they are consolidated to "city"
  if (
    level &&
    level !== 'federal' &&
    level !== 'state' &&
    level !== 'county' &&
    level !== 'city'
  ) {
    level = 'city';
  }
  return level;
}

async function getRaceDatabaseId(nodeId) {
  const query = `
  query Node {
    node(id: "${nodeId}") {
        ... on Race {
            databaseId
            id
        }
    }
}
`;
  const { node } = await sails.helpers.graphql.queryHelper(query);
  return node?.databaseId;
}

async function getRaceById(raceId) {
  const query = `
    query Node {
      node(id: "${raceId}") {
          ... on Race {
              databaseId
              isPartisan
              isPrimary
              election {
                  electionDay
                  name
                  state
              }
              position {
                  description
                  judicial
                  level
                  name
                  partisanType
                  staggeredTerm
                  state
                  subAreaName
                  subAreaValue
                  tier
                  electionFrequencies {
                      frequency
                  }
                  hasPrimary
              }
          }
      }
  }
  `;
  const { node } = await sails.helpers.graphql.queryHelper(query);
  return node;
}
