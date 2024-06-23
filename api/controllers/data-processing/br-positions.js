module.exports = {
  inputs: {},

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
    try {
      // or each BallotCandidate - get position. First look for it in the DB then in ballotReady API.
      const ballotCandidates = await BallotCandidate.find({
        where: { positionId: { '!=': null } },
        select: ['positionId', 'id'],
      });
      for (const ballotCandidate of ballotCandidates) {
        try {
          const { positionId } = ballotCandidate;
          if (positionId) {
            let position = await BallotPosition.findOne({
              ballotId: positionId,
            });
            if (!position) {
              const encodedPositionId =
                await sails.helpers.ballotready.encodeId(
                  positionId,
                  'Position',
                );
              const brPosition = await sails.helpers.ballotready.getPosition(
                encodedPositionId,
              );
              if (brPosition) {
                position = await BallotPosition.create({
                  ballotId: positionId,
                  ballotHashId: encodedPositionId,
                  data: brPosition,
                }).fetch();
              }
            }
            if (position) {
              await BallotCandidate.addToCollection(
                ballotCandidate.id,
                'positions',
                position.id,
              );
            }
          }
        } catch (e) {
          console.log('error at data-processing/br-positions');
          await sails.helpers.slack.errorLoggerHelper(
            'data-processing/br-positions',
            { ballotCandidateId: ballotCandidate.id, e },
          );
          console.log(e);
        }
      }
      await sails.helpers.slack.errorLoggerHelper(
        'Finished processing positions',
        { count: ballotCandidates.length },
      );
      return exits.success({ message: 'ok', count: ballotCandidates.length });
    } catch (e) {
      console.log('error at data-processing/br-positions');
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'data-processing/br-positions',
        e,
      );
      return exits.badRequest({
        message: 'unknown error',
        error: e,
      });
    }
  },
};
