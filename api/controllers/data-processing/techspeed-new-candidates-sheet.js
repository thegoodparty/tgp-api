/* eslint-disable camelcase */
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { race } = require('async');
const { google } = require('googleapis');
const { create } = require('lodash');
const slugify = require('slugify');
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
      console.log('starting techspeed-enhance');
      const jwtClient = await authenticateGoogleServiceAccount();
      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });

      const spreadsheetId = '15xJzodkSvYWNTvdfqwjNJeE7H3VF0kVZiwwfgrD6q2Y';

      // Read rows from the sheet
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'TechSpeed Candidates',
      });

      const rows = readResponse.data.values;

      const columnNames = rows[1];
      console.log('columnNames', columnNames);
      let processedCount = 0;
      for (let i = 2; i < rows.length; i++) {
        // for (let i = 2; i < 5; i++) {
        const row = rows[i];
        console.log('row', row);
        // start from 2 to skip header
        console.log('processing row : ', i);
        const processedRow = await processRow(row, columnNames);
        console.log('processedRow : ', processedRow);
        isExisting = await findExistingCandidate(processedRow);
        if (isExisting) {
          console.log('isExisting');
          await updateExistingCandidate(processedRow, isExisting);
        } else {
          await createCandidate(processedRow);
        }
        rows[i][row.length - processColumn] = 'processed';
        processedCount++;
      }
      console.log('writing to sheet');
      // write back to google sheets
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'TechSpeed Candidates',
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
      console.log('error enhancing candidates : ', e);
      return exits.badRequest({
        message: 'unknown error',
        e,
      });
    }
  },
};

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

    for (let i = 0; i < columnNames.length; i++) {
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

async function findExistingCandidate(row) {
  try {
    const { parsedCandidate } = row;
    const { first_name, last_name, office_name, email } = parsedCandidate;
    const slug = slugify(`${first_name}-${last_name}-${office_name}`, {
      lower: true,
    });
    const existing = await BallotCandidate.findOne({ slug });
    if (existing) {
      console.log('existing candidate found');
      return existing;
    }

    const existingEmail = await BallotCandidate.findOne({ email });
    if (existingEmail) {
      console.log('existing email found');
      return existingEmail;
    }

    return null;
  } catch (e) {
    console.log('error finding candidate : ', e);
    return null;
  }
}

async function streamToString(readableStream) {
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function createCandidate(row) {
  try {
    const { parsedCandidate } = row;
    const {
      first_name,
      last_name,
      office_name,
      email,
      party,
      phone,
      state,
      city,
      postal_code,
      ballotready_race_id,
      office_level,
      election_result,
      general_election_date,
      candidate_id_tier,
      is_primary,
      office_normalized,
    } = parsedCandidate;

    const slug = slugify(`${first_name}-${last_name}-${office_name}`, {
      lower: true,
    });

    const candidate = await BallotCandidate.create({
      slug,
      firstName: first_name,
      lastName: last_name,
      email,
      phone,
      state,
      party,
      city,
      electionDay: general_election_date,
      raceId: ballotready_race_id,
      postalCode: postal_code,
      positionName: office_name,
      level: office_level,
      electionResult: election_result,
      isPrimary: is_primary === 'TRUE',
      normalizedPositionName: office_normalized,
      tier: candidate_id_tier,
      vendorTsData: parsedCandidate,
    });

    let ballotRace = await BallotRace.findOne({
      ballotId: ballotready_race_id,
    });
    if (ballotRace) {
      await BallotCandidate.addToCollection(
        candidate.id,
        'races',
        ballotRace.id,
      );
    }
  } catch (e) {
    console.log('error creating candidate : ', e);
  }
}

async function updateExistingCandidate(row, existingCandidate) {
  try {
    await BallotCandidate.updateOne({ id: existingCandidate.id }).set({
      vendorTsData: row.parsedCandidate,
    });
  } catch (e) {
    console.log('error updating existing candidate : ', e);
  }
}
