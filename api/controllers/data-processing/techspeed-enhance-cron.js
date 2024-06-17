const { google } = require('googleapis');
const AWS = require('aws-sdk');
const googleServiceEmail =
  'good-party-service@thegoodparty-1562658240463.iam.gserviceaccount.com';

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

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

      // Create a parameters JSON object
      const updatedRows = [];
      for (let i = 1; i < rows.length; i++) {
        // start from 1 to skip header
        const row = await processRow(rows[i]);
        console.log('processed row', row);
        updatedRows.push(row);
      }

      // Write back to the sheet
      // await sheets.spreadsheets.values.update({
      //   spreadsheetId: spreadsheetId,
      //   range: 'enhanced',
      //   valueInputOption: 'RAW',
      //   requestBody: {
      //     values: updatedRows,
      //   },
      // });

      await sails.helpers.slack.errorLoggerHelper(
        'Successfully enhanced candidates',
        {},
      );

      return exits.success({
        updatedRows,
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

async function processRow(candidate) {
  try {
    if (!candidate) {
      return [];
    }

    console.log('candidate[9]', candidate[9]);
    console.log('processing row : ', candidate);
    if (candidate[9]) {
      // already processed
      console.log('already processed', candidate.length);
      return candidate;
    }
    const firstName = candidate[0];
    const lastName = candidate[1];
    const city = candidate[2];
    const state = candidate[3];
    const email = candidate[4];
    console.log('procsessing row : ', firstName, lastName);

    return [...candidate];
  } catch (e) {
    console.log('error processing row : ', candidate);
    console.log('error : ', e);
    return [...candidate, 'n/a', 'n/a'];
  }
}
