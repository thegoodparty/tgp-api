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
          electionDate: electionDay, //new Date(electionDay).getTime(),
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
          electionDate: electionDay, //new Date(electionDay).getTime(),
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
      return exits.success({
        message: 'Error in addElection',
        error: JSON.stringify(error),
      });
    }
  },
};
