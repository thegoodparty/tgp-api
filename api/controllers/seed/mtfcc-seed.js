/* eslint-disable camelcase */
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
      const jwtClient = await authenticateGoogleServiceAccount();
      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });

      const spreadsheetId = '1Ye6wwrGLVQQL32Jjq6BwPcpEhqKwpygrKBm2j_c_fvk';

      // Read rows from the sheet
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'mtfcc-mapping',
      });

      const rows = readResponse.data.values;

      let processedCount = 0;
      // for (let i = 1; i < rows.length; i++) {
      for (let i = 1; i < 25; i++) {
        const row = rows[i];
        await processRow(row);
        processedCount++;
      }

      console.log('Successfully loaded mtfcc mapping');

      await sails.helpers.slack.errorLoggerHelper(
        'Successfully loaded mtfcc mapping',
        { processedCount },
      );

      return exits.success({
        processedCount,
      });
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper('Error in mtfcc-seed', e);
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

async function processRow(entity) {
  try {
    if (!entity) {
      return;
    }
    const [mtfcc, mtfcc_type, geo_id, name, state] = entity;
    console.log('processing row : ', {
      mtfcc,
      mtfcc_type,
      geo_id,
      name,
      state,
    });
    await CensusEntity.findOrCreate(
      {
        mtfcc,
        mtfccType: mtfcc_type,
        geoId: geo_id,
        name,
        state,
      },
      {
        mtfcc,
        mtfccType: mtfcc_type,
        geoId: geo_id,
        name,
        state,
      },
    );
  } catch (e) {
    console.log('error processing row : ', entity);
    console.log('error : ', e);
  }
}
