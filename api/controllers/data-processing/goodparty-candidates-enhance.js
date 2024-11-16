/* eslint-disable camelcase */
const { google } = require('googleapis');
const { formatDateForGoogleSheets } = require('../../utils/dates');
const { authenticateGoogleServiceAccount } = require('../../utils/dataProcessing/authenticateGoogleServiceAccount');
const { padRowToMatchColumns } = require('../../utils/dataProcessing/padRowToMatchColumns');

const appBase = sails.config.custom.appBase || sails.config.appBase;

// the process column changes based on the app base. prod - last column, qa - second last column, dev - third last column
let processColumn = 2;
if (appBase === 'https://qa.goodparty.org') {
  processColumn = 3;
}
if (
  appBase === 'https://dev.goodparty.org' ||
  appBase === 'http://localhost:4000'
) {
  processColumn = 4;
}

module.exports = {
  inputs: {
    startRow: {
      type: 'number',
      required: false,
      description: 'Optional row number to start reading and writing from.',
      defaultsTo: 2, // Default to 2 to skip header
    },
    limit: {
      type: 'number',
      required: false,
      description: 'Maximum number of unprocessed rows to process.',
      defaultsTo: 100, // Set a default limit of 100 rows
    },
  },
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
      const { startRow, limit } = inputs;
      console.log('process column:', processColumn);
      console.log('starting goodparty-candidates-enhance');
      const jwtClient = await authenticateGoogleServiceAccount();
      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });

      const spreadsheetId = '15xJzodkSvYWNTvdfqwjNJeE7H3VF0kVZiwwfgrD6q2Y';

      // Read rows from the sheet
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'GoodParty Candidates',
      });

      const rows = readResponse.data.values;

      if (!rows || rows.length <= startRow) {
        throw new Error('No rows receiving from Google Sheets or startRow exceeds data length');
      }

      const columnNames = rows[1];
      console.log('columnNames: ', columnNames)

      const modifiedRows = [];
      modifiedRows.push(rows[0]);
      modifiedRows.push(rows[1]);

      let processedCount = 0;
      for (let i = startRow; i < rows.length; i++) {
        if (processedCount >= limit) {
          console.log('Reached the processing limit:', limit);
          break;
        }
        console.log('processing row : ', i + 1);
        
        const row = padRowToMatchColumns(rows[i], columnNames.length);
        console.log('Length of row after padding:', row.length, 'length of columnNames:', columnNames.length);
        console.log('Current row:', row);
        
        const processedRow = await processRow(row, columnNames);
        if (!processedRow) {
          console.log(`Skipping row ${i + 1} because it was already processed.`);
          continue;
        }
        console.log('processedRow : ', processedRow);

        const isUpdated = await saveVendorData(processedRow);

        console.log('isUpdated : ', isUpdated, i + 1);

        if (isUpdated) {
          
          const today = formatDateForGoogleSheets(new Date);
          console.log('updated1');
          row[columnNames.length - processColumn] = today;
          modifiedRows.push(row);
          console.log('updated2');
          processedCount++;
          console.log('processed');
        }
      }
      console.log('writing to sheet');
      // write back to google sheets
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'GoodParty Candidates',
        valueInputOption: 'RAW',
        requestBody: {
          values: modifiedRows,
        },
      });
      console.log('done writing to sheet');

      await sails.helpers.slack.errorLoggerHelper(
        'Successfully enhanced candidates',
        {},
      );

      return;
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error enhancing candidates',
        e,
      );
      throw new Error(`goodparty-candidates enhancement failed: ${e.message}`);
    }
  },
};

async function processRow(candidate, columnNames) {
  try {
    if (!candidate) {
      console.log('No candidate passed to processRow');
      return null;
    }
    const gpProcessed = candidate[candidate.length - processColumn];
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(gpProcessed)) { // Date regex

      const dateProcessedByTs = candidate[columnNames.indexOf('date processed by TS')];

      if(!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateProcessedByTs)) {
        console.log("'date processed by TS' contains an invalid value", dateProcessedByTs);
        return null;
      }
      const convertedDateProcessedByTs = new Date(Date.parse(dateProcessedByTs));
      const convertedGpProcessed = new Date(Date.parse(gpProcessed));

      if (convertedGpProcessed > convertedDateProcessedByTs) { // If false, TS has updated the row since we last consumed it
        console.log('convertedGpProcessed more recent than convertedDateProcessedByTs', gpProcessed, processColumn);
        return null;
      }
      console.log('has been updated since last consumption', gpProcessed, processColumn);
    } else {
      console.log('gpProcessed did not have a date', gpProcessed);
    }
    const parsedCandidate = {};

    for (let i = 0; i < columnNames.length - 4; i++) {
      parsedCandidate[columnNames[i]] = candidate[i];
    }

    if (parsedCandidate['STATUS (Complete, Not Yet Started, Exception)'] !== 'Complete') {
      console.log('candidate hasnt been processed by TS');
      return null; // Hasn't been processed by TechSpeed
    }

    return {
      parsedCandidate,
    };
  } catch (e) {
    console.log('error processing row : ', candidate);
    console.log('error : ', e);
    return [...candidate, 'n/a', 'n/a'];
  }
}

async function saveVendorData(row) {
  try {
    const { parsedCandidate } = row;
    if (!parsedCandidate['Campaign ID']) {
      console.error('Missing required campaign ID from Techspeed');
      return false;
    }

    const updatedVendorTsData = transformColumnNames(parsedCandidate);
    const updated = await Campaign.updateOne({
      id: parsedCandidate['Campaign ID'],
    }).set({
      vendorTsData: updatedVendorTsData,
    });
    await sails.helpers.crm.updateCampaign(updated);
    return !!updated;
  } catch (e) {
    console.error('error saving vendor candidate : ', e);
  }
}

function transformColumnNames(parsedCandidate) {
  const changedKeysOnly = {}

  const keyMap = {
    'incumbent': 'isIncumbent',
    'Incumbent Source URL': 'incumbentSourceUrl',
    'opponents': 'numberOfOpponents',
    'Opponent Source URL': 'opponentSourceUrl',
    'STATUS (Complete, Not Yet Started, Exception)': 'status',
    'E.3 Candidates ID - Headshot': 'headshotUrl',
    '9. candidate specific campaign finance filing URL': 'candidateFinanceFilingUrl',
    'A. Flag If the Candidate Source List URL is  minable with AI, human, bulk download': 'sourceListUrlMinableBy',
    'A. Source URL for specific race': 'raceSourceUrl',
    'A. Flag If the  Race Source URL is  minable with AI, human, bulk download': 'raceSourceUrlMinableBy',
    'B. Number of seats available in a race': 'numberOfSeats',
    'C. Term of office (for the seat)': 'officeTerm',
    'D. Number of candidates running for seat': 'numberOfCandidates',
    'URL for Campaign Finance Filing site for jurisdiction/Office': 'officeFinanceFilingUrl',
    'URL for where prospective candiates can find Filing information (how to file to run for this office)': 'howToFileUrl',
    'C.1 Set the trigger date for re-election mining (Based on the term of the office)': 'reelectionMiningTriggerDate',
    'F. Election Results - URL for results posted': 'electionResultsUrl',
    'F. Vote Totals': 'voteTotals',
    'Comment': 'comment',
    'date processed by TS': 'dateProcessedByTs',
  };
  

  for (const key in parsedCandidate) {
    if (keyMap[key]) {
      const newKey = keyMap[key];
      changedKeysOnly[newKey] = parsedCandidate[key];
    }
  }
  
  return changedKeysOnly;
}