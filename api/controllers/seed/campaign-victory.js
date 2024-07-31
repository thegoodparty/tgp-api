const handlePathToVictory = require('../../utils/campaign/handlePathToVictory');
const getRaceDetails = require('../../utils/campaign/getRaceDetails');
const moment = require('moment');

module.exports = {
  friendlyName: 'Campaign p2v',

  description: 'Run p2v for Campaigns.',

  inputs: {
    limit: {
      type: 'number',
      description: 'Limit the number of campaigns to process',
      defaultsTo: 0,
    },
    slug: {
      type: 'string',
      description: 'Slug for a specific campaign',
    },
  },

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const { limit, slug } = inputs;
    let p2vQuery = `
    select c.id
    from public.campaign as c
    inner join public.pathtovictory as pathtovictory on c.id = pathtovictory.campaign
    where c.details->>'pledged'='true'
    and (c.details->>'runForOffice'='yes' or c.details->>'knowRun'='true')
    and c.details->>'electionDate' is not null
    and c.details->>'raceId' is not null
    and (pathtovictory.data->>'p2vStatus'='Waiting' OR pathtovictory.data->>'p2vStatus' is null)
    and pathtovictory.data->>'p2vNotNeeded' is null
    `;
    if (slug) {
      p2vQuery += ` and c.slug = '${slug}'`;
    }
    p2vQuery += ' order by c.id desc';
    if (limit > 0) {
      p2vQuery += ` limit ${limit}`;
    }

    let p2vs = await sails.sendNativeQuery(p2vQuery);
    const rows = p2vs?.rows;
    console.log('rows', rows.length);

    for (const row of rows) {
      console.log('row', row);
      let campaignId = row.id;
      if (campaignId && campaignId > 0) {
        try {
          await runP2V(campaignId);
        } catch (error) {
          console.error('Error processing campaignId', campaignId, error);
        }
      } else {
        console.log('invalid campaignId', campaignId);
      }
    }

    return exits.success({
      message: 'ok',
    });
  },
};

async function runP2V(campaignId) {
  const campaign = await Campaign.findOne({ id: campaignId });
  const { slug, details } = campaign;
  const { raceId, positionId } = details;
  if (!raceId || !slug || !positionId) {
    console.log(
      `invalid raceId, slug, or positionId for campaignId ${campaignId}`,
    );
    return;
  }

  let data = await getRaceDetails(raceId, slug, '', false);
  // sails.helpers.log(slug, 'data', data);
  if (!data || !data?.slug || !data?.electionLevel) {
    sails.helpers.log(slug, `Failed to get Race for campaign ${campaignId}`);
    await sails.helpers.slack.slackHelper(
      {
        title: 'getRaceDetails Error.',
        body: `Error! ${slug}. Failed to get Race for campaign ${campaignId}`,
      },
      'victory-issues',
    );
    return;
  }

  sails.helpers.log(
    slug,
    `processing campaignId: ${campaignId}. office: ${data.officeName}. state: ${data.electionState}. level: ${data.electionLevel}`,
  );

  let position;
  try {
    position = await BallotPosition.findOne({
      ballotHashId: positionId.toString(),
    });
  } catch (e) {
    console.log('error getting position', e);
  }

  let electionDates = [];
  if (
    position &&
    position?.electionDates &&
    position.electionDates.length > 0
  ) {
    for (const electionDateObj of position.electionDates) {
      if (
        electionDateObj?.electionDay &&
        electionDateObj?.isPrimary === false &&
        electionDateObj?.isRunoff === false
      ) {
        electionDates.push(electionDateObj.electionDay);
      }
    }
    console.log('electionDates', electionDates);
    if (electionDates.length > 0) {
      data.priorElectionDates = electionDates;
    }
  }

  const { pathToVictoryResponse } = await handlePathToVictory({ ...data });
  sails.helpers.log(slug, 'pathToVictoryResponse', pathToVictoryResponse);

  if (
    pathToVictoryResponse &&
    pathToVictoryResponse?.counts?.total &&
    pathToVictoryResponse.counts.total > 0
  ) {
    try {
      await PathToVictory.updateOne({ campaign: campaignId }).set({
        data: {
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
          p2vStatus: 'Complete',
        },
      });
    } catch (e) {
      console.log('error updating campaign', e);
    }
  }
}
