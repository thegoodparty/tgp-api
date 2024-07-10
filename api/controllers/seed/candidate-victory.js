const handlePathToVictory = require('../../utils/campaign/handle-path-to-victory');
const getRaceDetails = require('../../utils/campaign/get-race-details');
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
  },

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const { limit } = inputs;
    let p2vQuery = `
        select id
        from public.ballotcandidate
        where "p2vData" is null
        and "positionId" is not null and "positionId" != ''
        and "raceId" is not null and "raceId" != ''
        and party != 'Republican' and party != 'Democratic'
        order by id desc
    `;
    if (limit > 0) {
      p2vQuery += ` limit ${limit}`;
    }
    let p2vs = await sails.sendNativeQuery(p2vQuery);
    const rows = p2vs?.rows;
    console.log('rows', rows.length);
    for (const row of rows) {
      let candidateId = row.id;
      if (candidateId && candidateId > 0) {
        await runP2V(candidateId);
      } else {
        console.log('invalid candidateId', candidateId);
      }
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
  sails.helpers.log(slug, 'data', data);
  if (!data || !data?.slug || !data?.electionLevel) {
    console.log('invalid race data', data);
    return;
  }

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
