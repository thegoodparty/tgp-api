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
        where: { electionId: { '!=': null } },
        select: ['electionId', 'id'],
      });
      for (const ballotCandidate of ballotCandidates) {
        try {
          const { electionId } = ballotCandidate;
          if (electionId) {
            let election = await BallotElection.findOne({
              ballotId: electionId,
            });
            if (!election) {
              const encodedElectionId =
                await sails.helpers.ballotready.encodeId(
                  electionId,
                  'Election',
                );
              const brElection = await sails.helpers.ballotready.getElection(
                encodedElectionId,
              );
              if (brElection) {
                election = await BallotElection.create({
                  ballotId: electionId,
                  ballotHashId: encodedElectionId,
                  data: brElection,
                  electionDate: brElection.originalElectionDate,
                  state: brElection.state,
                }).fetch();
              }
            }
            if (election) {
              await BallotCandidate.addToCollection(
                ballotCandidate.id,
                'elections',
                election.id,
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
        'Finished processing elections',
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
