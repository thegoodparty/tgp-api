const handlePathToVictory = require('../../utils/campaign/handle-path-to-victory');
const getRaceDetails = require('../../utils/campaign/get-race-details');

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
        select count(*)
        from public.ballotcandidate
        where "p2vData" is null
        and "positionId" is not null and "positionId" != ''
        and "raceId" is not null and "raceId" != ''
    `);
    const rows = p2vs?.rows;
    console.log('rows', rows.length);
    for (const row of rows) {
      let candidateId = row.id;
      await runP2V(candidateId);
    }
    return exits.success({
      message: 'ok',
    });
  },
};

async function runP2V(candidateId) {
  const candidate = await BallotCandidate.findOne({ id: candidateId });
  const { raceId, slug, positionId } = candidate;

  let ballotRaceId = await sails.helpers.ballotready.encodeId(
    raceId,
    'PositionElection',
  );

  const data = await getRaceDetails(ballotRaceId, slug, '', false);
  data.campaignId = campaignId;
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
    pathToVictoryResponse.electionLocation &&
    pathToVictoryResponse.electionLocation !== '' &&
    pathToVictoryResponse?.counts?.total &&
    pathToVictoryResponse.counts.total > 0
  ) {
    await BallotCandidate.updateOne({ id: candidateId }).set({
      p2vData: pathToVictoryResponse,
    });
  }
}
