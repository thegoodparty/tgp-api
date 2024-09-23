const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');
const { isArray } = require('lodash');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

// Define your possible filters and columns
const filtersList = [
  'VotingPerformanceEvenYearGeneral',
  'VotingPerformanceEvenYearPrimary',
  'VotingPerformanceEvenYearGeneralAndPrimary',
  'VotingPerformanceMinorElection',
];

const voterTypes = {
  firstTimeVoters: ['0%'],
  unlikelyVoters: ['20%'],
  unreliableVoters: ['40%'],
  likelyVoters: ['50%'],
  superVoters: ['80%', '100%'],
};

const columnsList = [
  ['Parties_Description'],
  ['Ethnic_Description'],
  ['Voters_Gender'],
  ['Parties_Description', 'Ethnic_Description'],
  ['Parties_Description', 'Voters_Gender'],
  ['Ethnic_Description', 'Voters_Gender'],
  ['Parties_Description', 'Ethnic_Description', 'Voters_Gender'],
];

module.exports = {
  friendlyName: 'Nebraska spike',

  description: 'Analyze nebraska voter data.',

  inputs: {},

  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    console.log('Starting nebraska spike');

    // Execute the function to run all queries and generate the CSV report
    runQueriesAndGenerateCsv();

    return exits.success({
      message: 'ok',
    });
  },
};

async function getVoterStats(searchUrl, filters, columns) {
  try {
    let estimateResponse;
    try {
      estimateResponse = await axios.post(searchUrl, {
        format: 'counts',
        filters,
        columns,
      });
    } catch (e) {
      console.log('error at getVoterStats estimateResponse', e);
    }
    if (estimateResponse?.data) {
      return estimateResponse.data;
    } else {
      console.log(
        'error at getVoterStats estimateResponse.data',
        estimateResponse,
      );
    }
  } catch (e) {
    console.log('error at getVoterStats', e);
  }
  return undefined;
}

async function runQueriesAndGenerateCsv() {
  const electionState = 'NE';
  const searchUrl = `https://api.l2datamapping.com/api/v2/records/search/1OSR/VM_${electionState}?id=1OSR&apikey=${l2ApiKey}`;
  const csvData = [];

  for (let filter of filtersList) {
    console.log(`*********** STARTING FILTER: ${filter}`);
    for (let voterType in voterTypes) {
      console.log(`**** STARTING VOTER TYPE: ${voterType}`);
      const subFilter = voterTypes[voterType];
      for (let columns of columnsList) {
        const filters = { [filter]: subFilter };
        // sleep for 10 seconds to avoid API rate limit
        await new Promise((resolve) => setTimeout(resolve, 10000));
        const rows = await getVoterStats(searchUrl, filters, columns);
        console.log(`QUERYING COLUMNS: ${columns.join(', ')}`);
        if (rows && isArray(rows) && rows.length > 0) {
          for (const row of rows) {
            csvData.push({
              filter,
              voterType,
              columns: columns.join(', '),
              ...row,
            });
          }
        } else {
          console.log('Invalid rows', rows);
          if (rows && rows?.message) {
            console.log('Error message', rows.message);
            if (rows.message.includes('API threshold reached')) {
              console.log('API threshold reached. Stopping the process');
              return;
            }
          }
        }
      }
    }
  }

  console.log("All Done! Let's generate the CSV");
  const csvPath = path.join(__dirname, 'voter_stats_report.csv');
  console.log(`Generating CSV at ${csvPath}`);
  const csv = parse(csvData);
  fs.writeFileSync(csvPath, csv);
  console.log(`CSV generated at ${csvPath}`);
}
