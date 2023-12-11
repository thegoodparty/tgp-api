const appBase = sails.config.custom.appBase || sails.config.appBase;
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
let csvFilePath = path.join(
  __dirname,
  '../../../data/geoPoliticalEntities/dec23/uscounties_v1.73_short.csv',
);

if (
  appBase === 'https://goodparty.org' ||
  appBase === 'https://qa.goodparty.org'
) {
  csvFilePath = path.join(
    __dirname,
    '../../../data/geoPoliticalEntities/dec23/uscounties_v1.73.csv',
  );
}

let count = 0;
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      readAndProcessCSV(csvFilePath);
      return exits.success({
        message: `inserted ${count} counties`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

function readAndProcessCSV(filePath) {
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      // Immediately invoked async function to handle each row
      (async () => {
        await insertCountyIntoDatabase(row);
      })();
    })
    .on('end', () => {
      console.log('CSV file successfully processed');
    });
}

async function insertCountyIntoDatabase(row) {
  try {
    const { county, state_id } = row;
    // console.log('county', county);
    // console.log('state_id', state_id);
    const exists = await County.findOne({
      name: county,
      state: state_id,
    });
    if (!exists) {
      await County.create({
        name: county,
        state: state_id,
        data: row,
      });
      count++;
    }
  } catch (e) {
    console.log('error in insertIntoDb', e);
  }
}
