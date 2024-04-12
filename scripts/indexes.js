// This is a script to add indexes to the database.
// It must be run manually via `sails run indexes.js`

module.exports = {
  friendlyName: 'Add indexes',

  description: 'Add indexes to the models.',

  inputs: {},

  exits: {},

  fn: async function (inputs, exits) {
    console.log('creating votersearch.l2ColumnIndex');
    // voterSearch indexes
    try {
      // composite index
      await sails.getDatastore().sendNativeQuery(`
          CREATE INDEX l2ColumnIndex ON public.votersearch ("l2ColumnName", "l2ColumnValue")
        `);
    } catch (error) {
      console.log('l2ColumnIndex already exists');
    }

    // l2Count indexes
    console.log('creating l2count.l2CountIndex');
    // composite index
    try {
      await sails.getDatastore().sendNativeQuery(`
        CREATE INDEX l2CountIndex ON public.l2count ("electionType", "electionLocation", "electionDistrict")
      `);
    } catch (error) {
      console.log('l2CountIndex already exists');
    }

    // // BallotElection indexes
    // console.log('creating sparse index on BallotElection.ballotId');
    // // sparse index
    // try {
    //   await sails.getDatastore().sendNativeQuery(`
    //     CREATE UNIQUE INDEX ballotIdIndex ON public.ballotelection (ballotId) WHERE ballotId IS NOT NULL
    //   `);
    // } catch (error) {
    //   console.log('ballotIdIndex already exists');
    // }

    // console.log('creating sparse index on BallotElection.ballotHashId');
    // // sparse index
    // try {
    //   await sails.getDatastore().sendNativeQuery(`
    //     CREATE UNIQUE INDEX ballotHashIdIndex ON public.ballotelection (ballotHashId) WHERE ballotHashId IS NOT NULL
    //   `);
    // } catch (error) {
    //   console.log('ballotHashIdIndex already exists');
    // }

    // // BallotPosition indexes
    // console.log('creating sparse index on BallotPosition.ballotId');
    // // sparse index
    // try {
    //   await sails.getDatastore().sendNativeQuery(`
    //     CREATE UNIQUE INDEX ballotIdIndex ON public.ballotposition (ballotId) WHERE ballotId IS NOT NULL
    //   `);
    // } catch (error) {
    //   console.log('ballotIdIndex already exists');
    // }

    // console.log('creating sparse index on BallotPosition.ballotHashId');
    // // sparse index
    // try {
    //   await sails.getDatastore().sendNativeQuery(`
    //     CREATE UNIQUE INDEX ballotHashIdIndex ON public.ballotposition (ballotHashId) WHERE ballotHashId IS NOT NULL
    //   `);
    // } catch (error) {
    //   console.log('ballotHashIdIndex already exists');
    // }

    // // BallotRace indexes
    // console.log('creating sparse index on BallotRace.ballotId');
    // // sparse index
    // try {
    //   await sails.getDatastore().sendNativeQuery(`
    //     CREATE UNIQUE INDEX ballotIdIndex ON public.ballotrace (ballotId) WHERE ballotId IS NOT NULL
    //   `);
    // } catch (error) {
    //   console.log('ballotIdIndex already exists');
    // }

    // console.log('creating sparse index on BallotRace.ballotHashId');
    // // sparse index
    // try {
    //   await sails.getDatastore().sendNativeQuery(`
    //     CREATE UNIQUE INDEX ballotHashIdIndex ON public.ballotrace (ballotHashId) WHERE ballotHashId IS NOT NULL
    //   `);
    // } catch (error) {
    //   console.log('ballotHashIdIndex already exists');
    // }

    // BallotCandidate indexes
    console.log('creating sparse index on BallotCandidate.email');
    // sparse index
    try {
      await sails.getDatastore().sendNativeQuery(`
        CREATE UNIQUE INDEX emailIndex ON public.ballotcandidate (email) WHERE email IS NOT NULL
      `);
    } catch (error) {
      console.log('emailIndex already exists');
    }

    console.log('creating sparse index on BallotCandidate.candidateId');
    // sparse index
    try {
      await sails.getDatastore().sendNativeQuery(`
        CREATE UNIQUE INDEX candidateIdIndex ON public.ballotcandidate ("candidateId") WHERE "candidateId" IS NOT NULL
      `);
    } catch (error) {
      console.log('candidateIdIndex already exists');
    }

    console.log('creating sparse index on BallotCandidate.phone');
    // sparse index
    try {
      await sails.getDatastore().sendNativeQuery(`
        CREATE UNIQUE INDEX phoneIndex ON public.ballotcandidate (phone) WHERE phone IS NOT NULL
      `);
    } catch (error) {
      console.log('phoneIndex already exists');
    }

    // Report back to Sails that the migration was successful
    return exits.success();
  },
};
