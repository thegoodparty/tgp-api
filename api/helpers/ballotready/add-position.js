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
      const { positionId, electionId, data } = row;

      const existingRecord = await BallotPosition.findOne({
        ballotId: positionId,
      });

      console.log(`inserting ${positionId} into position db`);

      if (existingRecord) {
        await BallotPosition.updateOne({ ballotId: positionId }).set({
          positionDate: new Date(positionDay).getTime(),
          data,
        });
      } else {
        const ballotHashId = await sails.helpers.ballotready.encodeId(
          positionId,
          'Position',
        );

        await BallotPosition.create({
          ballotId: positionId,
          ballotHashId: ballotHashId,
          ballotElection: electionId,
          data,
        });
      }
      return exits.success({
        message: 'ok',
      });
    } catch (error) {
      console.log('Error in addPosition', error);
      return exits.badRequest({
        message: 'Error in addPosition',
        error: JSON.stringify(error),
      });
    }
  },
};
