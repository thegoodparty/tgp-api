// This is a script to add indexes to the database.
// It must be run manually via `sails run indexes.js`

module.exports = {
  friendlyName: 'Add indexes',

  description: 'Add indexes to the models.',

  inputs: {},

  exits: {},

  fn: async function (inputs, exits) {
    // Run the raw SQL query to add composite indexes
    console.log('creating votersearch l2ColumnIndex');
    await sails.getDatastore().sendNativeQuery(`
          CREATE INDEX l2ColumnIndex ON public.votersearch ("l2ColumnName", "l2ColumnValue")
        `);

    // Report back to Sails that the migration was successful
    return exits.success();
  },
};
