/* eslint-disable camelcase */
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { google } = require('googleapis');
const googleServiceEmail =
  'good-party-service@thegoodparty-1562658240463.iam.gserviceaccount.com';

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

const appBase = sails.config.custom.appBase || sails.config.appBase;

// the process column changes based on the app base. prod - last column, qa - second last column, dev - third last column
let processColumn = 1;
if (appBase === 'https://qa.goodparty.org') {
  processColumn = 2;
}
if (
  appBase === 'https://dev.goodparty.org' ||
  appBase === 'http://localhost:4000'
) {
  processColumn = 3;
}

const s3 = new S3Client({
  region: 'us-west-2',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const s3Bucket = 'goodparty-keys';

module.exports = {
  inputs: {},

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

      const columnNames = rows[1];
      let processedCount = 0;
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        // start from 2 to skip header
        console.log('processing row : ', i);
        const processedRow = await processRow(row, columnNames);
        console.log('processedRow : ', processedRow);
        const isUpdated = await saveVendorData(processedRow);

        console.log('isUpdated : ', isUpdated, i);

        if (isUpdated) {
          const today = formatDateForGoogleSheets(new Date);
          console.log('updated1');
          rows[i][row.length - processColumn] = today;
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
          values: rows,
        },
      });
      console.log('done writing to sheet');

      await sails.helpers.slack.errorLoggerHelper(
        'Successfully enhanced candidates',
        {},
      );

      return exits.success({
        processedCount,
      });
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error enhancing candidates',
        e,
      );
      return exits.badRequest({
        message: 'unknown error',
        e,
      });
    }
  },
};

function formatDateForGoogleSheets(date) {
  const month = date.getMonth() + 1; // Months are zero based
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

async function authenticateGoogleServiceAccount() {
  try {
    // Fetch the service account JSON from S3
    const googleServiceJSON = await readJsonFromS3(
      s3Bucket,
      'google-service-key.json',
    );

    // Log the keys to check if 'private_key' exists
    const parsed = JSON.parse(googleServiceJSON);

    // Extract the private key from the service account JSON
    const googleServiceKey = parsed.private_key;
    if (!googleServiceKey) {
      throw new Error('No private key found in the service account JSON.');
    }

    // Configure a JWT client with the service account credentials
    const jwtClient = new google.auth.JWT(
      googleServiceEmail, // Client email from the JSON
      null, // No keyFile, as we are providing the key directly
      googleServiceKey, // The private key from the JSON
      ['https://www.googleapis.com/auth/spreadsheets'], // Scopes
    );

    return jwtClient;
  } catch (error) {
    console.error('Error authenticating Google Service Account:', error);
    throw error;
  }
}

async function readJsonFromS3(bucketName, keyName) {
  try {
    const params = {
      Bucket: bucketName,
      Key: keyName,
    };

    const getCommand = new GetObjectCommand(params);
    const data = await s3.send(getCommand);
    const jsonContent = await streamToString(data.Body);
    return jsonContent;
  } catch (error) {
    console.log('Error reading JSON from S3:', error);
    throw error;
  }
}

async function processRow(candidate, columnNames) {
  try {
    if (!candidate) {
      return [];
    }
    const gpProcessed = candidate[candidate.length - processColumn];
    // console.log('processing row : ', candidate);
    if (gpProcessed === 'processed') {
      // already processed
      console.log('already processed', gpProcessed, processColumn);
      return candidate;
    }
    const parsedCandidate = {};

    for (let i = 0; i < columnNames.length - 3; i++) {
      parsedCandidate[columnNames[i]] = candidate[i];
    }

    console.log('parsedCandidate : ', parsedCandidate);

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
      return;
    }

    const updatedVendorTsData = transformColumnNames(parsedCandidate);
    const updated = await Campaign.updateOne({
      id: parsedCandidate['Campaign ID'],
    }).set({
      vendorTsData: updatedVendorTsData,
    });
    return !!updated;
  } catch (e) {
    console.error('error saving vendor candidate : ', e);
  }
}

function transformColumnNames(parsedCandidate) {
  const changedKeysOnly = {}

  const keyMap = {
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

async function streamToString(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
