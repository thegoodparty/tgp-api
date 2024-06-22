/* eslint-disable camelcase */
const { google } = require('googleapis');
const AWS = require('aws-sdk');
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

AWS.config.update({
  region: 'us-west-2',
  accessKeyId,
  secretAccessKey,
});

const s3Bucket = 'goodparty-keys';
const s3 = new AWS.S3();

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
      console.log('starting techspeed-enhance');
      const jwtClient = await authenticateGoogleServiceAccount();
      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });

      const spreadsheetId = '15xJzodkSvYWNTvdfqwjNJeE7H3VF0kVZiwwfgrD6q2Y';

      // Read rows from the sheet
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Enhanced BallotReady Candidates',
      });

      const rows = readResponse.data.values;

      const columnNames = rows[1];
      let processedCount = 0;
      for (let i = 2; i < rows.length; i++) {
        // for (let i = 2; i < 5; i++) {
        const row = rows[i];
        // start from 2 to skip header
        console.log('processing row : ', i);
        const processedRow = await processRow(row, columnNames);
        console.log('processedRow : ', processedRow);
        const isUpdated = await saveVendorCandidate(processedRow);

        console.log('isUpdated : ', isUpdated, i);

        if (isUpdated) {
          console.log('updated1');
          rows[i][row.length - processColumn] = 'processed';
          console.log('updated2');
          processedCount++;
          console.log('processed');
        }
      }
      console.log('writing to sheet');
      // write back to google sheets
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Enhanced BallotReady Candidates',
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

async function authenticateGoogleServiceAccount() {
  const googleServiceJSON = await readJsonFromS3(
    s3Bucket,
    'google-service-key.json',
  );
  const googleServiceKey = googleServiceJSON.private_key;
  // Configure a JWT client with service account
  const jwtClient = new google.auth.JWT(
    googleServiceEmail,
    null,
    googleServiceKey,
    ['https://www.googleapis.com/auth/spreadsheets'],
  );
  return jwtClient;
}

async function readJsonFromS3(bucketName, keyName) {
  try {
    const params = {
      Bucket: bucketName,
      Key: keyName,
    };
    const data = await s3.getObject(params).promise();
    const jsonContent = JSON.parse(data.Body.toString());
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

async function saveVendorCandidate(row) {
  try {
    const { parsedCandidate } = row;
    const { ballotready_candidate_id, phone_clean, email } = parsedCandidate;
    if (!ballotready_candidate_id) {
      console.log('missing required fields');
      return;
    }
    const updated = await BallotCandidate.updateOne({
      brCandidateId: ballotready_candidate_id,
    }).set({
      vendorTsPhone: phone_clean || '',
      vendorTsEmail: email || '',
      vendorTsData: parsedCandidate,
    });
    return !!updated;
  } catch (e) {
    console.log('error saving vendor candidate : ', e);
  }
}
