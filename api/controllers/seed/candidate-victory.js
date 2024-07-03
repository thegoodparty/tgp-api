const handlePathToVictory = require('../../utils/campaign/handle-path-to-victory');
const getRaceDetails = require('../../utils/campaign/get-race-details');
const moment = require('moment');

module.exports = {
  friendlyName: 'Candidate p2v',

  description: 'Run p2v for Candidates.',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    const p2vs = await sails.sendNativeQuery(`
        select id
        from public.ballotcandidate
        where "p2vData" is null
        and "positionId" is not null and "positionId" != ''
        and "raceId" is not null and "raceId" != ''
        and party != 'Republican' and party != 'Democratic'
    `);
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
      `invalid race ${raceId} or slug ${slug} or positionId ${positionId}`,
    );
    return;
  }

  let ballotRaceId = await sails.helpers.ballotready.encodeId(
    raceId,
    'PositionElection',
  );

  const data = await getRaceDetails(ballotRaceId, slug, '', false);
  sails.helpers.log(slug, 'data', data);

  const position = await BallotPosition.findOne({ ballotId: positionId });
  let electionDates = [];
  if (position.electionDates && position.electionDates.length > 0) {
    for (const electionDateObj of position.electionDates) {
      if (
        electionDateObj?.isPrimary === false &&
        electionDateObj?.isRunoff === false
      ) {
        electionDates.push(electionDateObj.electionDay);
      }
    }
    console.log('electionDates', electionDates);
    data.priorElectionDates = electionDates;
  }

  const { pathToVictoryResponse } = await handlePathToVictory({ ...data });
  sails.helpers.log(slug, 'pathToVictoryResponse', pathToVictoryResponse);

  if (
    pathToVictoryResponse &&
    pathToVictoryResponse?.counts?.total &&
    pathToVictoryResponse.counts.total > 0
  ) {
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
  }
}
