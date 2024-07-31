const handlePathToVictory = require('../../utils/campaign/handlePathToVictory');
const getRaceDetails = require('../../utils/campaign/getRaceDetails');
const moment = require('moment');

module.exports = {
  friendlyName: 'Candidate p2v',

  description: 'Run p2v for Candidates.',

  inputs: {
    limit: {
      type: 'number',
      description: 'Limit the number of candidates to process',
      defaultsTo: 0,
    },
    lt: {
      type: 'number',
      description: 'Limit the id to less than this number',
      defaultsTo: 0,
    },
    slug: {
      type: 'string',
      description: 'Slug for a specific candidate',
    },
  },

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const { limit, lt, slug } = inputs;
    let p2vQuery = `
        select id
        from public.ballotcandidate
        where "p2vData" is null
        and "positionId" is not null and "positionId" != ''
        and "raceId" is not null and "raceId" != ''
        and party != 'Republican' and party != 'Democratic'        
    `;
    if (slug) {
      p2vQuery += ` and slug = '${slug}'`;
    }
    if (lt > 0) {
      p2vQuery += ` and id < ${lt}`;
    }
    p2vQuery += ' order by id desc';
    if (limit > 0) {
      p2vQuery += ` limit ${limit}`;
    }

    let p2vs = await sails.sendNativeQuery(p2vQuery);
    const rows = p2vs?.rows;
    console.log('rows', rows.length);

    const batch_size = 5;
    for (let i = 0; i < rows.length; i += batch_size) {
      const batch = rows.slice(i, i + batch_size);
      await Promise.all(
        batch.map(async (row) => {
          let candidateId = row.id;
          if (candidateId && candidateId > 0) {
            try {
              await runP2V(candidateId);
            } catch (error) {
              console.error('Error processing candidateId', candidateId, error);
            }
          } else {
            console.log('invalid candidateId', candidateId);
          }
        }),
      );
    }

    return exits.success({
      message: 'ok',
    });
  },
};

async function runP2V(candidateId) {
  const candidate = await BallotCandidate.findOne({ id: candidateId });
  const { raceId, slug, positionId } = candidate;
  if (!raceId || !slug || !positionId) {
    console.log(
      `invalid raceId, slug, or positionId for candidateId ${candidateId}`,
    );
    return;
  }

  let ballotRaceId = await sails.helpers.ballotready.encodeId(
    raceId,
    'PositionElection',
  );

  let data = await getRaceDetails(ballotRaceId, slug, '', false);
  // sails.helpers.log(slug, 'data', data);
  if (!data || !data?.slug || !data?.electionLevel) {
    sails.helpers.log(slug, `Failed to get Race for candidate ${candidateId}`);
    await sails.helpers.slack.slackHelper(
      {
        title: 'getRaceDetails Error.',
        body: `Error! ${slug}. Failed to get Race for candidate ${candidateId}`,
      },
      'victory-issues',
    );
    return;
  }

  sails.helpers.log(
    slug,
    `processing candidateId: ${candidateId}. office: ${data.officeName}. state: ${data.electionState}. level: ${data.electionLevel}`,
  );

  let position;
  try {
    position = await BallotPosition.findOne({
      ballotId: positionId.toString(),
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
      await BallotCandidate.updateOne({ id: candidateId }).set({
        p2vData: {
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
        },
      });
    } catch (e) {
      console.log('error updating candidate', e);
    }
  }
}
