const appBase = sails.config.custom.appBase || sails.config.appBase;
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
let csvFilePath = path.join(__dirname, '../../../data/locations.csv');
let cityCount = 0;
let countyCount = 0;
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      let rows = await loadCSV(csvFilePath);
      for (const row of rows) {
        await searchLocations(row);
      }
      return exits.success({
        message: `inserted ${cityCount} city locations and ${countyCount} county locations`,
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

async function loadCSV(filePath) {
  let rows = [];
  let finished = false;
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('end', () => {
      finished = true;
    });
  while (!finished) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return rows;
}

async function searchLocations(row) {
  try {
    const { state, type, name } = row;
    if (type === 'County') {
      let countyName = cleanupName(name);
      // console.log('checking county', countyName);
      const counties = await County.find({
        name: countyName,
      });
      if (!counties || counties.length === 0) {
        countyCount++;
        // console.log('could not find county', countyName);
      }
    } else if (type === 'City') {
      let cityName = cleanupName(name);
      // console.log('checking city', cityName);
      const cities = await Municipality.find({
        name: cityName,
      });
      if (!cities || cities.length === 0) {
        cityCount++;
        // console.log('could not find city', cityName);
      }
    }
  } catch (e) {
    console.log('error in locations.js', e);
  }
}

function toTitleCase(string) {
  return string
    .split(' ')
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function cleanupName(name) {
  name = name.replace(/[^a-zA-Z0-9 ]/g, '');
  name = toTitleCase(name);
  name = name.replace(' County', '');
  name = name.replace(' Village', '');
  name = name.replace(' VLG', '');
  name = name.replace(' Township', '');
  name = name.replace(' TWP', '');
  name = name.replace(' City', '');
  name = name.replace(' County', '');
  name = name.replace(/\(.*\)/, '');
  return name;
}
