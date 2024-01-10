const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputFilePath = path.join(
  __dirname,
  '../../../data/temp/recruitment_v1_01_03_2024_08_37.csv',
);

const outputFilePath = path.join(
  __dirname,
  '../../../data/temp/reduced_recruitment_v1_01_03_2024_08_37.csv',
);

const columns = [
  'id',
  'election_name',
  'election_day',
  'position_name',
  'sub_area_name',
  'sub_area_value',
  'sub_area_name_secondary',
  'sub_area_value_secondary',
  'state',
  'level',
  'filing_periods',
];

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      reduceCsvFile();
      return exits.success({
        message: `saved`,
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

async function reduceCsvFile() {
  const headers = columns.map((col) => ({ id: col, title: col }));
  headers[headers.length - 1] = {
    id: 'filing_date_start',
    title: 'filing_date_start',
  };

  headers.push({
    id: 'filing_date_end',
    title: 'filing_date_end',
  });

  headers.push({
    id: 'processed_name',
    title: 'processed_name',
  });

  headers.push({
    id: 'processed_level',
    title: 'processed_level',
  });

  console.log('headers', headers);
  // Set up the CSV writer
  const csvWriter = createCsvWriter({
    path: outputFilePath,
    header: headers,
  });

  // Create a read stream
  const readStream = fs.createReadStream(inputFilePath);

  // Create an array to hold the data chunks
  let dataChunks = [];
  readStream
    .pipe(csv())
    .on('data', (row) => {
      // Filter out the unwanted columns
      (async () => {
        try {
          const filteredRow = {};
          const { name, level } =
            await sails.helpers.ballotready.extractLocation(row);

          columns.forEach((col) => {
            if (col === 'filing_periods') {
              const dates = extractDates(row[col]);
              if (dates) {
                filteredRow.filing_date_start = dates.startDate;
                filteredRow.filing_date_end = dates.endDate;
              } else {
                filteredRow.filing_date_start = '';
                filteredRow.filing_date_end = '';
              }
            } else {
              filteredRow[col] = row[col];
            }
          });
          filteredRow.processed_name = name;
          filteredRow.processed_level = level;
          dataChunks.push(filteredRow);
        } catch (e) {
          console.log('error caught', e);
        }
      })();
    })
    .on('end', () => {
      // Write the filtered data to a new CSV file
      console.log('======= writing =========');
      csvWriter
        .writeRecords(dataChunks)
        .then(() => console.log('The CSV file was written successfully'));
    });
}

function extractDates(str) {
  // the string format is [{"notes"=>nil, "end_on"=>"2024-05-10", "start_on"=>"2024-05-06"}] or []
  // Replace '=>' with ':' to make it a valid JSON string
  if (!str || str === '' || str === '[]') {
    return false;
  }
  try {
    let validJsonString = str.replace(/=>/g, ':');
    validJsonString = validJsonString.replace(/nil/g, 'null');

    // Parse the string as JSON
    const jsonObject = JSON.parse(validJsonString);

    // Extract the 'start_on' and 'end_on' dates
    const startDate = jsonObject[0].start_on;
    const endDate = jsonObject[0].end_on;

    return { startDate, endDate };
  } catch (e) {
    console.log('error', e);
    return false;
  }
}
