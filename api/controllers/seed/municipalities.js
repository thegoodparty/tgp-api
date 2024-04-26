// https://simplemaps.com/data/us-cities
const appBase = sails.config.custom.appBase || sails.config.appBase;
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const slugify = require('slugify');
let csvFilePath = path.join(
  __dirname,
  '../../../data/geoPoliticalEntities/dec23/uscities_v1.77_short.csv',
);

let count = 0;
module.exports = {
  inputs: {
    partNumber: {
      type: 'number',
    },
    loadAll: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

  exits: {},

  async fn(inputs, exits) {
    try {
      const { partNumber, loadAll } = inputs;
      if (
        appBase === 'https://goodparty.org' ||
        appBase === 'https://qa.goodparty.org' ||
        loadAll === true
      ) {
        csvFilePath = path.join(
          __dirname,
          `../../../data/geoPoliticalEntities/dec23/cities/cities_part${partNumber}.csv`,
        );
      }
      let count = 0;
      let rows = await readAndProcessCSV(csvFilePath);
      for (const row of rows) {
        await insertCityIntoDatabase(row);
        count++;
      }

      console.log('finished inserting cities');
      return exits.success({
        message: `inserted ${count} cities`,
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

async function readAndProcessCSV(filePath) {
  let rows = [];
  let finished = false;
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('end', () => {
      console.log('CSV file successfully processed');
      finished = true;
    });

  while (finished === false) {
    console.log('waiting for file to finish processing');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return rows;
}

async function insertCityIntoDatabase(row) {
  try {
    const { city, state_id, county_name, township, incorporated } = row;
    // console.log('state_id', state_id);

    let type = 'city';
    if (township === 'TRUE') {
      type = 'township';
    } else if (incorporated === 'FALSE') {
      type = 'town';
    }

    let county = await County.findOne({
      name: county_name,
      state: state_id,
    });
    if (county) {
      await sails.helpers.ballotready.addCity(
        row,
        city,
        county.id,
        state_id,
        county_name,
        type,
      );
    } else {
      console.log(
        'county does not exist. adding county',
        county_name,
        state_id,
      );
      county = await sails.helpers.ballotready.addCounty(
        county_name,
        state_id,
        row,
      );
      if (county) {
        await sails.helpers.ballotready.addCity(
          row,
          city,
          county.id,
          state_id,
          county_name,
          type,
        );
      }
    }
  } catch (e) {
    console.log('error in insertIntoDb', e);
  }
}
