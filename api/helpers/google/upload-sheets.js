const { google } = require('googleapis');
const fs = require('fs');
const AWS = require('aws-sdk');

const googleServiceEmail =
  'good-party-service@thegoodparty-1562658240463.iam.gserviceaccount.com';

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

AWS.config.update({
  region: 'eu-west-2',
  accessKeyId,
  secretAccessKey,
});

const s3Bucket = 'goodparty-keys';

const s3 = new AWS.S3();

module.exports = {
  inputs: {
    fileName: {
      type: 'string',
      required: true,
    },
    sheetId: {
      type: 'string',
      required: true,
    },
    tabName: {
      type: 'string',
      required: true,
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { fileName, sheetId, tabName } = inputs;

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

      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });

      createAndUploadCsv(sheets, sheetId, fileName, tabName);

      return exits.success();
    } catch (e) {
      console.log('error at helpers/google/upload-sheets', e);
      await sails.helpers.slack.errorLoggerHelper(
        'error at helpers/google/upload-sheets',
        e,
      );
      throw e;
    }
  },
};

function createAndUploadCsv(sheets, spreadsheetId, fileName, tabName) {
  // Create a new sheet in the spreadsheet
  sheets.spreadsheets.batchUpdate(
    {
      spreadsheetId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: tabName,
              },
            },
          },
        ],
      },
    },
    (err, response) => {
      if (err) {
        // Handle error
        console.log(err);
        throw err;
      } else {
        // Sheet created, now upload CSV data
        uploadCsvToTab(sheets, spreadsheetId, fileName, tabName);
      }
    },
  );
}

function uploadCsvToTab(sheets, spreadsheetId, fileName, tabName) {
  const range = tabName; // Replace with your range

  // Read CSV file
  let csvContent = fs.readFileSync(fileName, 'utf8');

  // Convert CSV content to a 2D array
  // You might need a CSV parser here for complex CSV files
  const rows = csvContent.split('\n').map((row) => row.split(','));

  const resource = {
    values: rows,
  };

  sheets.spreadsheets.values.update(
    {
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource,
    },
    (err, result) => {
      if (err) {
        // Handle error
        console.log(err);

        throw err;
      } else {
        // console.log('%d cells updated.', result.updatedCells);
      }
    },
  );
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
