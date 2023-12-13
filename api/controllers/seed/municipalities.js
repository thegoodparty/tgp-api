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

if (
  appBase === 'https://goodparty.org' ||
  appBase === 'https://qa.goodparty.org'
) {
  csvFilePath = path.join(
    __dirname,
    '../../../data/geoPoliticalEntities/dec23/uscities_v1.77.csv',
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

function readAndProcessCSV(filePath) {
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      // Immediately invoked async function to handle each row
      (async () => {
        await insertCityIntoDatabase(row);
      })();
    })
    .on('end', () => {
      console.log('CSV file successfully processed');
    });
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

    const county = await County.findOne({
      name: county_name,
      state: state_id,
    });
    if (county) {
      const slug = `${slugify(state_id, {
        lower: true,
      })}/${slugify(county_name, {
        lower: true,
      })}/${slugify(city, {
        lower: true,
      })}`;

      const exists = await Municipality.findOne({
        type,
        slug,
      });
      if (!exists) {
        await Municipality.create({
          name: city,
          type,
          state: state_id,
          county: county.id,
          data: row,
          slug,
        });
        count++;
      }
    }
  } catch (e) {
    console.log('error in insertIntoDb', e);
  }
}
