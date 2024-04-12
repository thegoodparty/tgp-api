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
      // this script updates every single BallotRace with a hashid.
      let races = await BallotRace.find({});
      for (const race of races) {
        const hashid = await sails.helpers.ballotready.encodeId(
          race.ballotId,
          'PositionElection',
        );
        await BallotRace.updateOne({
          id: race.id,
        }).set({
          ballotHashId: hashid,
        });
        console.log(`updated race ${race.id} with hashid ${hashid}`);
      }

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at data-processing/fix-hashids');
      console.log(e);
      // await sails.helpers.slack.errorLoggerHelper(
      //   'data-processing/ballot-s3',
      //   e,
      // );
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};
