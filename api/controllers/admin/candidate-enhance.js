// See https://github.com/peopledatalabs/peopledatalabs-js
const PDLJS = require('peopledatalabs');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const AWS = require('aws-sdk');

const googleServiceEmail =
  'good-party-service@thegoodparty-1562658240463.iam.gserviceaccount.com';

const peopleLabKey =
  sails.config.custom.peopleLabKey || sails.config.peopleLabKey;

const PDLJSClient = new PDLJS({ apiKey: peopleLabKey });

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
      const jwtClient = await authenticateGoogleServiceAccount();

      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });

      const spreadsheetId = '1RtSsYx4bbVvsNFw9aZxi2GDplcVCTft95bClcuPQPaE';

      // Read rows from the sheet
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'incoming', // Adjust based on your sheet's name and range you want to read
      });

      const rows = readResponse.data.values;
      console.log('rows', rows);

      // Create a parameters JSON object
      const updatedRows = [];
      for (let i = 0; i < rows.length; i++) {
        const row = await processRow(rows[i]);
        console.log('processed row', row);
        updatedRows.push(row);
      }

      // Write back to the sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'enhanced',
        valueInputOption: 'RAW',
        requestBody: {
          values: updatedRows,
        },
      });

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
    if (candidate.length > 6) {
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

    const params = {
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      location: `${city}, ${state}`,
      region: state,
      country: 'United States',
      email,
      min_likelihood: 6,
      // pretty: true,
    };
    console.log('params to send', params);

    // Pass the parameters object to the Person Enrichment API
    const jsonResponse = await PDLJSClient.person.enrichment(params);

    // Print the API response in JSON format
    console.log(jsonResponse);
    return [
      ...candidate,
      jsonResponse?.data?.phone_numbers
        ? JSON.stringify(jsonResponse?.data?.phone_numbers)
        : 'n/a',
      JSON.stringify(jsonResponse?.data),
    ];
  } catch (e) {
    console.log('error processing row : ', candidate);
    console.log('error : ', e);
    return [...candidate, 'n/a', 'n/a'];
  }
}
