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
      await sails.helpers.slack.errorLoggerHelper(
        'starting data-processing/br-candidacies',
        {},
      );
      let processed = 0;
      // or each BallotCandidate - get position. First look for it in the DB then in ballotReady API.
      const ballotCandidates = await BallotCandidate.find({
        select: ['brData', 'id'],
      });
      for (const ballotCandidate of ballotCandidates) {
        try {
          const { brData } = ballotCandidate;
          const candidacyId = brData?.candidacy_id;
          if (!candidacyId) {
            continue;
          }

          const candidacyHashId = await sails.helpers.ballotready.encodeId(
            candidacyId,
            'Candidacy',
          );

          const candidacyData = await sails.helpers.ballotready.getCandidacy(
            candidacyHashId,
          );
          await BallotCandidate.updateOne({ id: ballotCandidate.id }).set({
            brCandidacyData: candidacyData,
          });
          processed++;
        } catch (e) {
          console.log('error at data-processing/br-candidacies');
          await sails.helpers.slack.errorLoggerHelper(
            'data-processing/br-candidacies',
            { ballotCandidateId: ballotCandidate.id, e },
          );
          console.log(e);
        }
      }
      await sails.helpers.slack.errorLoggerHelper(
        'Finished processing candidacies',
        { count: ballotCandidates.length, processed },
      );
      return exits.success({
        message: 'ok',
        count: ballotCandidates.length,
        processed,
      });
    } catch (e) {
      console.log('error at data-processing/br-candidacies');
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'data-processing/br-candidacies',
        e,
      );
      return exits.badRequest({
        message: 'unknown error',
        error: e,
      });
    }
  },
};
