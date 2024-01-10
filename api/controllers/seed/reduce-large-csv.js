const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputFilePath = path.join(
  __dirname,
  '../../../data/temp/recruitment_v1_01_03_2024_08_37.csv',
);

const outputFilePath = path.join(__dirname, '../../../data/temp/');

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
  const csvWriterQ1 = createCsvWriter({
    path: `${outputFilePath}candidates-2024Q1.csv`,
    header: headers,
  });

  const csvWriterQ2 = createCsvWriter({
    path: `${outputFilePath}candidates-2024Q2.csv`,
    header: headers,
  });

  const csvWriterQ3 = createCsvWriter({
    path: `${outputFilePath}candidates-2024Q3.csv`,
    header: headers,
  });

  const csvWriterQ4 = createCsvWriter({
    path: `${outputFilePath}candidates-2024Q4.csv`,
    header: headers,
  });

  const csvWriter2025 = createCsvWriter({
    path: `${outputFilePath}candidates-2025.csv`,
    header: headers,
  });

  const date2023 = new Date('1/1/2024');
  const dateQ1 = new Date('4/1/2024');
  const dateQ2 = new Date('7/1/2024');
  const dateQ3 = new Date('10/1/2024');
  const dateQ4 = new Date('1/1/2025');

  // Create a read stream
  const readStream = fs.createReadStream(inputFilePath);

  // Create an array to hold the data chunks
  let dataChunksQ1 = [];
  let dataChunksQ2 = [];
  let dataChunksQ3 = [];
  let dataChunksQ4 = [];
  let dataChunks2025 = [];
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

          const electionDate = new Date(row.election_day);
          if (electionDate < date2023) {
            // do nothing
          } else if (electionDate < dateQ1) {
            dataChunksQ1.push(filteredRow);
          } else if (electionDate < dateQ2) {
            dataChunksQ2.push(filteredRow);
          } else if (electionDate < dateQ3) {
            dataChunksQ3.push(filteredRow);
          } else if (electionDate < dateQ4) {
            dataChunksQ4.push(filteredRow);
          } else {
            dataChunks2025.push(filteredRow);
          }
        } catch (e) {
          console.log('error caught', e);
        }
      })();
    })
    .on('end', () => {
      (async () => {
        // Write the filtered data to a new CSV file
        console.log('======= writing =========');
        await csvWriterQ1.writeRecords(dataChunksQ1);
        console.log('Q1 CSV file was written successfully');

        await csvWriterQ2.writeRecords(dataChunksQ2);
        console.log('Q2 CSV file was written successfully');

        await csvWriterQ3.writeRecords(dataChunksQ3);
        console.log('Q3 CSV file was written successfully');

        await csvWriterQ4.writeRecords(dataChunksQ4);
        console.log('Q4 CSV file was written successfully');

        await csvWriter2025.writeRecords(dataChunks2025);
        console.log('2025 CSV file was written successfully');
      })();
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
