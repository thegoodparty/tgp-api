const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { promisify } = require('util');
const finished = promisify(require('stream').finished);

// let csvFilePath = path.join(__dirname, '../../../data/candidates');
let localFilePath = path.join(
  __dirname,
  '../../../data/temp/tech-speed-id.csv',
);

const processedRows = [];

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
      await processAndSaveCSV(localFilePath);

      let outputStr = '';
      for (let row of processedRows) {
        outputStr += `${Object.values(row).join(',')}
        <br/>`;
      }

      return exits.success(outputStr);
    } catch (e) {
      console.log('error at data-processing/ballot-s3');
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'data-processing/techspeed-enhance',
        e,
      );
      return exits.badRequest({
        message: 'unknown error',
        e,
      });
    }
  },
};

async function processAndSaveCSV(inputFilePath) {
  const rows = [];

  const readStream = fs.createReadStream(inputFilePath).pipe(csv());

  readStream.on('data', (row) => rows.push(row));

  await finished(readStream);

  // Process each row asynchronously

  for (let row of rows) {
    const processedRow = await processRowAsync(row); // Await the async operation here
    processedRows.push(processedRow);
  }
}

async function processRowAsync(row) {
  const { state, municipality, electionDay } = row;
  let isPrimary = '';
  let partisanType = '';

  const munRecord = await Municipality.findOne({
    name: municipality,
    state,
  });
  if (munRecord && electionDay) {
    const races = await BallotRace.find({
      municipality: munRecord.id,
      electionDate: new Date(electionDay).getTime(),
      // electionDate: 1730764900000,
    });
    if (races.length > 0) {
      const race = races[0].data;
      isPrimary = race.is_primary;
      partisanType = race.partisan_type;
    }
  }

  const updated = {
    state,
    municipality,
    electionDay,
    isPrimary,
    partisanType,
  };
  // console.log('updated', updated);
  // Add the modified row to the rows array
  return updated;
}
