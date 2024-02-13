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
      const { office, state, city, district, officeTermLength, otherOffice } =
        details;

      let ballotRace;
      if (details?.raceId) {
        let raceId = details.raceId;
        console.log('raceId', raceId);
        // if raceId is numeric. test it using a regex. since its a string.
        if (!raceId.match(/^\d+$/)) {
          raceId = await getRaceDatabaseId(raceId);
          console.log('determined raceId', raceId);
        }
        ballotRace = await BallotRace.findOne({
          ballotId: raceId.toString(),
        });
      }

      console.log('ballotRace', ballotRace);

      let queueMessage = {
        type: 'pathToVictory',
        data: {
          campaignId: campaign.id,
        },
      };

      // if they selected a position during onboarding we use that information
      if (ballotRace) {
        console.log('found ballotRace');
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
        console.log(
          'ballotRace.data?.partisan_type',
          ballotRace.data?.partisan_type,
        );
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
      } else {
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
          termLength = officeTermLength.match(/\d+/)[0];
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
      }

      sails.helpers.log(slug, 'queueing Message', queueMessage);
      await sails.helpers.queue.enqueue(queueMessage);
      return exits.success({ message: 'ok' });
    } catch (e) {
      console.log('error at enqueue', e);
      return exits.success({ message: 'not ok', e });
    }
  },
};

async function getRaceDatabaseId(nodeId) {
  const query = `
  query Node {
    node(id: "${nodeId}") {
        id
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
