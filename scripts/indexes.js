// This is a script to add indexes to the database.
// It must be run manually via `sails run indexes.js`

module.exports = {
  friendlyName: 'Add indexes',

  description: 'Add indexes to the models.',

  inputs: {},

  exits: {},

  fn: async function (inputs, exits) {
    // Run the raw SQL query to add composite or sparse indexes
    console.log('creating votersearch.l2ColumnIndex');
    await sails.getDatastore().sendNativeQuery(`
          CREATE INDEX l2ColumnIndex ON public.votersearch ("l2ColumnName", "l2ColumnValue")
        `);

    console.log('creating l2count.l2CountIndex');
    await sails.getDatastore().sendNativeQuery(`
        CREATE INDEX l2CountIndex ON public.l2count ("electionType", "electionLocation", "electionDistrict")
      `);

    // Sparse indexes
    console.log('creating ballotcandidate.emailIndex');
    await sails.getDatastore().sendNativeQuery(`
      CREATE UNIQUE INDEX emailIndex ON public.ballotcandidate (email) WHERE email IS NOT NULL
    `);

    console.log('creating ballotcandidate.phoneIndex');
    await sails.getDatastore().sendNativeQuery(`
      CREATE UNIQUE INDEX phoneIndex ON public.ballotcandidate (phone) WHERE phone IS NOT NULL
    `);

    console.log('creating ballotcandidate.candidacyIndex');
    await sails.getDatastore().sendNativeQuery(`
      CREATE UNIQUE INDEX candidacyIndex ON public.ballotcandidate (candidacy_id) WHERE candidacy_id IS NOT NULL
    `);

    // Report back to Sails that the migration was successful
    return exits.success();
  },
};
