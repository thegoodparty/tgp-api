const pg = require('pg');
const copyTo = require('pg-copy-streams').to;
const { PassThrough } = require('stream');

const voterDatastore =
  sails.config.custom.voterDatastore || sails.config.voterDatastore;

module.exports = {
  inputs: {
    query: {
      type: 'string',
      required: true,
    },
    res: {
      type: 'ref',
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
      const { query, res } = inputs;
      const client = new pg.Client({
        connectionString: voterDatastore,
      });
      await client.connect();

      // Set the headers to instruct the browser to download the file
      res.set('Content-Disposition', 'attachment; filename="people.csv"');
      res.set('Content-Type', 'text/csv');
      const stream = client.query(
        copyTo(`COPY(${query}) TO STDOUT WITH CSV HEADER `),
      );
      const passThrough = new PassThrough();

      stream.on('error', (err) => {
        console.error('Error in stream:', err);
        (async () => {
          await sails.helpers.slack.errorLoggerHelper('Error in stream:', err);
        })();
        throw new Error(err);
      });

      // stream.on('data', (chunk) => {
      //   console.log('Data chunk received:', chunk.toString());
      // });

      stream.pipe(passThrough).pipe(res);

      passThrough.on('end', async () => {
        console.log('PassThrough stream ended');
        await client.end();
        return exits.success();
      });

      passThrough.on('error', (err) => {
        console.error('Error in PassThrough stream:', err);
        (async () => {
          await sails.helpers.slack.errorLoggerHelper(
            'Error in PassThrough stream',
            err,
          );
        })();
        throw new Error(err);
      });
    } catch (err) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error in csv-stream-helper.js',
        err,
      );

      throw new Error(err);
    }
  },
};
