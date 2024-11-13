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

      const columnNames = rows[1];
      let processedCount = 0;
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        // start from 2 to skip header
        console.log('processing row : ', i);
        const processedRow = await processRow(row, columnNames);
        if (!processedRow) {
          console.log(`Skipping row ${i + 2} because it was already processed.`);
          continue;
        }
        console.log('processedRow : ', processedRow);
        const isUpdated = await saveVendorData(processedRow);

        console.log('isUpdated : ', isUpdated, i + 2);

        if (isUpdated) {
          if (rows[i].length < columnNames.length) {
            for (let j = 0; j < columnNames.length - rows[i].length; j++) {
              rows[i].push('');
            }
          }
          const today = formatDateForGoogleSheets(new Date);
          console.log('updated1');
          rows[i][columnNames.length - processColumn] = today;
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
          values: rows,
        },
      });
      console.log('done writing to sheet');

      await sails.helpers.slack.errorLoggerHelper(
        'Successfully enhanced opponents',
        {},
      );

      return exits.success({
        processedCount,
      });
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error enhancing opponents',
        e,
      );
      throw new Error(`goodparty-opponents enhancement failed: ${e.message}`);
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

async function processRow(opponent, columnNames) {
  try {
    if (!opponent) {
      return [];
    }
    const gpProcessed = opponent[opponent.length - processColumn];
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

    console.log('parsedOpponent : ', parsedOpponent);

    return {
      parsedOpponent,
    };
  } catch (e) {
    console.log('error processing row : ', opponent);
    console.log('error : ', e);
    return [...opponent, 'n/a', 'n/a'];
  }
}

async function saveVendorData(row) {
  try {
    const { parsedOpponent } = row;
    if (!parsedOpponent['Campaign ID']) {
      console.error('Missing required campaign ID from Techspeed');
      return;
    }

    const updatedVendorTsData = transformColumnNames(parsedOpponent);
    const updated = await Opponent.create({
      campaignId: parsedOpponent['CampaignID'],
      partyAffiliation: parsedOpponent.partyAffiliation,
      firstName: parsedOpponent.firstName,
      lastName: parsedOpponent.lastName,
      sourceUrl: parsedOpponent.sourceUrl,
      campaignUrl: parsedOpponent.campaignUrl,
      financeFilingUrl: parsedOpponent.financeFilingUrl
    }).fetch();
    const updated = true;
    return !!updated;
  } catch (e) {
    console.error('error saving vendor opponent : ', e);
  }
}

function transformColumnNames(parsedOpponent) {
  const changedKeysOnly = {}

  const keyMap = {
    '8.a Opponant - Party affiliation (Democrat or Republican candidate running for same seat)': 'partyAffiliation',
    '8.b First name Opponent': 'firstName',
    '8.c Last name Opponent': 'lastName',
    'Source URL for Opponent list': 'sourceUrl',
    '8.d Campaign Website Opponent': 'campaignUrl',
    '9. Opponant specific campaign finance filing URL': 'financeFilingUrl'
  };
  

  for (const key in parsedOpponent) {
    if (keyMap[key]) {
      const newKey = keyMap[key];
      changedKeysOnly[newKey] = parsedOpponent[key];
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
