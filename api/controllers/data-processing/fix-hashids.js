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
      let totalRaces = await BallotRace.count();
      console.log('Total races: ', totalRaces);
      let offset = 0;
      let limit = 1000;
      let updated = 0;
      while (offset < totalRaces) {
        let races = await BallotRace.find({}).limit(limit).skip(offset);
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
          updated++;
          offset++;
          console.log(
            `updated race ${race.id} with hashid ${hashid}. updated: ${updated}`,
          );
        }
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
