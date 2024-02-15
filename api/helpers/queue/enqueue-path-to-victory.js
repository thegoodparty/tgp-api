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

      let ballotRace;
      if (details?.raceId) {
        let raceId = details.raceId;
        // console.log('raceId', raceId);
        // // if raceId is numeric. test it using a regex. since its a string.
        // let dbRaceId;
        // if (!raceId.match(/^\d+$/)) {
        //   dbRaceId = await getRaceDatabaseId(raceId);
        //   console.log('determined dbRaceId', dbRaceId);
        // }
        // ballotRace = await BallotRace.findOne({
        //   ballotId: dbRaceId.toString(),
        // });
        // if (ballotRace) {
        //   console.log('found ballotRace in database');
        //   queueMessage = await getBallotReadyDbMessage(
        //     queueMessage,
        //     campaign,
        //     ballotRace,
        //   );
        // } else {
        //   console.log(
        //     'ballotRace not found in database. getting data from api',
        //   );

        // API and AI Location Extraction is more accurate for now.
        queueMessage = await getBallotReadyApiMessage(
          queueMessage,
          campaign,
          raceId,
        );
        // }
      } else {
        console.log('queueing message using campaign details');
        queueMessage = await getCampaignDbMessage(queueMessage, campaign);
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

async function getCampaignDbMessage(queueMessage, campaign) {
  const { data } = campaign;
  const { details } = data;
  const { office, state, city, district, officeTermLength, otherOffice } =
    details;

  let goals = data?.goals;
  let electionDate = goals?.electionDate;
  // TODO: we don't currently store the election level in the campaign details
  // we need to add it to the campaign details
  // we currently guess by seeing if city is filled out.
  // we also need to add electionCounty to the campaign details
  // for now we do some basic guessing for electionLevel;
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
  const row = await getRaceById(raceId);
  console.log('row', row);

  const officeName = row?.position?.name;
  const locationData = await sails.helpers.ballotready.extractLocationAi(
    officeName,
  );

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
  const electionLevel = row?.position?.level.toLowerCase();
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

  // TODO: we should probably update campaign object with our findings if they are different.

  return queueMessage;
}

async function getBallotReadyDbMessage(queueMessage, campaign, ballotRace) {
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
    campaign.data.details.electionLevel = ballotRace.level;
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
    details: campaign.data.details,
  });

  return queueMessage;
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
