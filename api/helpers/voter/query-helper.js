const pg = require('pg');

const voterDatastore =
  sails.config.custom.voterDatastore || sails.config.voterDatastore;

module.exports = {
  inputs: {
    query: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { query } = inputs;
      const client = new pg.Client({
        connectionString: voterDatastore,
      });
      await client.connect();
      const result = await client.query(query);
      await client.end();
      return exits.success(result);
    } catch (err) {
      console.log('error at helpers/voter/query-helper', err);

      return exits.success({ route: inputs.route });
    }
  },
};
