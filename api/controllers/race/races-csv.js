const { Readable } = require('stream');
const fastCsv = require('fast-csv');

module.exports = {
  friendlyName: 'Races CSV',

  description: 'Generate a CSV file for races based on state',

  inputs: {
    state: {
      type: 'string',
      required: true,
      description: 'The state for which to generate the races CSV',
      maxLength: 2,
      minLength: 2,
    },
  },

  exits: {
    badRequest: {
      description: 'Error during CSV generation',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      // Setting the response type for CSV
      this.res.type('csv');
      this.res.set('Content-Disposition', 'attachment; filename="data.csv"');

      // Create a Readable Stream from your data source
      const dataStream = getDataStream(inputs.state);

      // Use `fast-csv` to format the data as CSV
      const csvStream = dataStream.pipe(fastCsv.format({ headers: true }));

      // Pipe the CSV stream to the response
      csvStream.pipe(this.res);
    } catch (error) {
      return exits.badRequest(error);
    }
  },
};

function getDataStream(state) {
  let offset = 0;
  const batchSize = 1000; // Adjust the batch size based on your needs

  const readableStream = new Readable({
    objectMode: true,
    async read() {
      try {
        // Fetch a batch of records from the database
        const records = await BallotRace.find({ state: state.toUpperCase() })
          .limit(batchSize)
          .skip(offset)
          .populate('municipality')
          .populate('county');

        if (records.length === 0) {
          // No more data to read
          this.push(null);
        } else {
          // Push each record into the stream

          records.forEach((record) => {
            const {
              position_name,
              filing_date_start,
              filing_date_end,
              election_day,
              partisan_type,
              level,
            } = record.data;
            const row = {
              position_name,
              filing_date_start,
              filing_date_end,
              election_day,
              partisan_type,
              municipality_name: record.municipality?.name || '',
              county_name: record.county?.name || '',
              level,
            };
            this.push(row);
          });
          offset += batchSize;
        }
      } catch (error) {
        this.emit('error', error);
      }
    },
  });

  return readableStream;
}
