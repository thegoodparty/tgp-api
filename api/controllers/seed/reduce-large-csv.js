const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const inputFilePath = path.join(
  __dirname,
  '../../../data/temp/recruitment_v1_01_24_2024_08_37.csv',
);

const outputFilePath1 = path.join(
  __dirname,
  '../../../data/temp/candidates2024_Q1.csv',
);
const outputFilePath2 = path.join(
  __dirname,
  '../../../data/temp/candidates2024_Q2.csv',
);
const outputFilePath3 = path.join(
  __dirname,
  '../../../data/temp/candidates2024_Q3.csv',
);
const outputFilePath4 = path.join(
  __dirname,
  '../../../data/temp/candidates2024_Q4.csv',
);

const headers = [
  { id: 'municipality', title: 'Municipality' },
  { id: 'state', title: 'State' },
  { id: 'filing_link', title: 'Filing Link' }, // empty
  {
    id: 'filing_date_end',
    title: 'Filing Deadline No Need for Research Until Date Reached',
  },
  { id: 'election_day', title: 'Election Day' },
];

const yearStart = new Date('2024-01-01');
const Q2Start = new Date('2024-04-01');
const Q3Start = new Date('2024-07-01');
const Q4Start = new Date('2024-10-01');
const yearEnd = new Date('2025-01-01');

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
  console.log('headers', headers);
  // Set up the CSV writer
  const csvWriterQ1 = createCsvWriter({
    path: outputFilePath1,
    header: headers,
  });
  const csvWriterQ2 = createCsvWriter({
    path: outputFilePath2,
    header: headers,
  });

  const csvWriterQ3 = createCsvWriter({
    path: outputFilePath3,
    header: headers,
  });

  const csvWriterQ4 = createCsvWriter({
    path: outputFilePath4,
    header: headers,
  });

  // Create a read stream
  const readStream = fs.createReadStream(inputFilePath);

  // Create an array to hold the data chunks
  let dataChunks1 = [];
  let dataChunks2 = [];
  let dataChunks3 = [];
  let dataChunks4 = [];

  const exists1 = {};
  const exists2 = {};
  const exists3 = {};
  const exists4 = {};
  readStream
    .pipe(csv())
    .on('data', (row) => {
      // Filter out the unwanted columns
      (async () => {
        try {
          const electionDate = new Date(row.election_day);
          if (electionDate > yearStart || electionDate < yearEnd) {
            const { name, level } =
              await sails.helpers.ballotready.extractLocation(row);
            const dates = extractDates(row.filing_periods);

            const filteredRow = {
              municipality: name,
              state: row.state,
              filing_link: '',
              filing_date_end: dates?.endDate || '',
              election_day: row.election_day,
            };
            // dedupe
            const existsKey = `${name}-${row.state}-${row.level}`;
            if (electionDate < Q2Start && !exists1[existsKey]) {
              exists1[existsKey] = true;
              dataChunks1.push(filteredRow);
            } else if (electionDate < Q3Start && !exists2[existsKey]) {
              exists2[existsKey] = true;
              dataChunks2.push(filteredRow);
            } else if (electionDate < Q4Start && !exists3[existsKey]) {
              exists3[existsKey] = true;
              dataChunks3.push(filteredRow);
            } else if (!exists4[existsKey]) {
              exists4[existsKey] = true;
              dataChunks4.push(filteredRow);
            }
          }
        } catch (e) {
          console.log('error caught', e);
        }
      })();
    })
    .on('end', () => {
      // Write the filtered data to a new CSV file
      console.log('======= writing =========');
      csvWriterQ1
        .writeRecords(dataChunks1)
        .then(() => console.log('The CSV Q1 file was written successfully'));
      csvWriterQ2.writeRecords(dataChunks2).then(() => {
        console.log('The CSV Q2 file was written successfully');
      });
      csvWriterQ3.writeRecords(dataChunks3).then(() => {
        console.log('The CSV Q3 file was written successfully');
      });
      csvWriterQ4.writeRecords(dataChunks4).then(() => {
        console.log('The CSV Q4 file was written successfully');
      });
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
