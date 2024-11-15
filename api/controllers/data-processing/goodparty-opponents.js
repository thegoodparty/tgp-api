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
      console.log('starting goodparty-opponents');
      const jwtClient = await authenticateGoogleServiceAccount();
      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });

      const spreadsheetId = '15xJzodkSvYWNTvdfqwjNJeE7H3VF0kVZiwwfgrD6q2Y';

      // Read rows from the sheet
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Good Party Candidate Opponents',
      });

      const rows = readResponse.data.values;

      if (!rows || rows.length <= startRow) {
        throw new Error('No rows receiving from Google Sheets or startRow exceeds data length');
      }
      console.log('rows length: ', rows.length);

      const columnNames = rows[1];
      let processedCount = 0;
      console.log('startRow index: ', startRow);
      console.log('startRow data: ', rows[startRow]);

      const modifiedRows = [];
      modifiedRows.push(rows[0]);
      modifiedRows.push(rows[1]);

      for (let i = startRow; i < rows.length; i++) {
        if (processedCount >= limit) {
          console.log('Reached the processing limit:', limit);
          break;
        }
        const row = padRowToMatchColumns(rows[i], columnNames.length);
        // start from 2 to skip header
        console.log('processing row : ', i + 1);

        const processedRow = await processRow(row, columnNames);

        if (!processedRow) {
          console.log(`Skipping row ${i + 1} because it was already processed.`);
          continue;
        }
        console.log('processedRow : ', processedRow);

        const isExisting = await findExistingOpponent(processedRow);

        let isUpdated = false;
        if (isExisting) {
          console.log('isExisting');
          isUpdated = await updateExistingOpponent(processedRow)
        } else {
          isUpdated = await createOpponent(processedRow);
        }

        

        console.log('isUpdated : ', isUpdated, i + 1);

        if (isUpdated) {
          const today = formatDateForGoogleSheets(new Date);
          console.log('updated1');
          row[columnNames.length - processColumn] = today;
          modifiedRows.push(row);
          console.log('\nrow: ', row);
          console.log('updated2');
          processedCount++;
          console.log('processed');
        }
      }
      console.log('writing to sheet');
      // write back to google sheets
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Good Party Candidate Opponents',
        valueInputOption: 'RAW',
        requestBody: {
          values: modifiedRows,
        },
      });
      console.log('done writing to sheet');

      await sails.helpers.slack.errorLoggerHelper(
        'Successfully enhanced opponents',
        {},
      );

      return;
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error enhancing opponents',
        e,
      );
      throw new Error(`goodparty-opponents enhancement failed: ${e.message}`);
    }
  },
};

async function processRow(opponent, columnNames) {
  try {
    if (!opponent) {
      return null;
    }
    const gpProcessed = opponent[opponent.length - processColumn];
    console.log('gpProcessed:', gpProcessed);
    console.log('processColumn:', processColumn);
    // console.log('processing row : ', opponent);
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(gpProcessed)) { // Date regex
      // already processed
      console.log('already processed', gpProcessed, processColumn);
      return null;
    }
    const parsedOpponent = {};

    for (let i = 0; i < columnNames.length - 4; i++) {
      parsedOpponent[columnNames[i]] = opponent[i];
    }

    //console.log('parsedOpponent : ', parsedOpponent);

    return {
      parsedOpponent,
    };
  } catch (e) {
    console.log('error processing row : ', opponent);
    console.log('error : ', e);
    return [...opponent, 'n/a', 'n/a'];
  }
}

async function createOpponent(row) {
  try {
    const { parsedOpponent } = row;
    if (!parsedOpponent['Campaign ID']) {
      console.error('Missing required campaign ID from Techspeed');
      return;
    }

    const updatedVendorTsData = transformColumnNames(parsedOpponent);
    const updated = await Opponent.create({
      partyAffiliation: updatedVendorTsData.partyAffiliation,
      firstName: updatedVendorTsData.firstName,
      lastName: updatedVendorTsData.lastName,
      sourceUrl: updatedVendorTsData.sourceUrl,
      campaignUrl: updatedVendorTsData.campaignUrl,
      financeFilingUrl: updatedVendorTsData.financeFilingUrl,
      campaignId: parsedOpponent['Campaign ID'],
    }).fetch();
    return !!updated;
  } catch (e) {
    console.error('error saving vendor opponent : ', e);
  }
}

function transformColumnNames(parsedOpponent) {
  const changedKeysOnly = {}

  const keyMap = {
    '8.a Opponant - Party affiliation (Democrat or Republican candidate running for same seat)': 'partyAffiliation', // It's misspelled on the gsheet
    '8.b First name Opponent': 'firstName',
    '8.c Last name Opponent': 'lastName',
    'Source URL for Opponent list': 'sourceUrl',
    '8.d Campaign Website Opponent': 'campaignUrl',
    '9. Opponant specific campaign finance filing URL': 'financeFilingUrl' // It's misspelled on the gsheet
  };
  

  for (const key in parsedOpponent) {
    if (keyMap[key]) {
      const newKey = keyMap[key];
      changedKeysOnly[newKey] = parsedOpponent[key];
    }
  }
  
  return changedKeysOnly;
}

async function findExistingOpponent(processedRow) {
  try {
    const { parsedOpponent } = processedRow;

    const existing = await Opponent.findOne({ 
      campaignId: parsedOpponent['Campaign ID'],
      firstName: parsedOpponent.firstName,
      lastName: parsedOpponent.lastName, 
    });
    if (existing) {
      return existing;
    }

    return null;
  } catch (e) {
    console.log('error finding opponent : ', e);
    return null;
  }
}

async function updateExistingOpponent(processedRow) {
  try {
    const { parsedOpponent } = processedRow;
    const updated = await Opponent.updateOne({ 
      campaignId: parsedOpponent['Campaign ID'],
      firstName: parsedOpponent.firstName,
      lastName: parsedOpponent.lastName, 
    }).set({
      partyAffiliation: parsedOpponent.partyAffiliation,
      firstName: parsedOpponent.firstName,
      lastName: parsedOpponent.lastName,
      sourceUrl: parsedOpponent.sourceUrl,
      campaignUrl: parsedOpponent.campaignUrl,
      financeFilingUrl: parsedOpponent.financeFilingUrl,
    });
    return !!updated;
  } catch (e) {
    console.log('error updating existing candidate : ', e);
  }
}