module.exports = {
  inputs: {
    row: {
      type: 'json',
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { row } = inputs;

    try {
      const { electionId, state, electionDay, data } = row;

      const existingRecord = await BallotElection.findOne({
        ballotId: electionId,
      });

      console.log(`inserting ${electionId} into election db`);

      if (existingRecord) {
        await BallotElection.updateOne({ ballotId: electionId }).set({
          electionDate: new Date(electionDay).getTime(),
          state,
          data,
        });
      } else {
        const ballotHashId = await sails.helpers.ballotready.encodeId(
          electionId,
          'Election',
        );

        const resp = await BallotElection.create({
          ballotId: electionId,
          ballotHashId: ballotHashId,
          electionDate: new Date(electionDay).getTime(),
          state: state,
          data,
        });
        console.log('resp', resp);
      }

      return exits.success({
        message: 'ok',
      });
    } catch (error) {
      console.log('Error in addElection', error);
      return exits.badRequest({
        message: 'Error in addElection',
        error: JSON.stringify(error),
      });
    }
  },
};