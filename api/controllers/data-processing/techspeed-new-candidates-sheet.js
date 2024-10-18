/* eslint-disable camelcase */
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { google } = require('googleapis');
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
    const { startRow, limit } = inputs; // Extract the startRow and limit inputs
    let processedCount = 0;

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

      let processedUnprocessedCount = 0;

      // Loop through rows starting at startRow
      for (let i = startRow; i < rows.length; i++) {
        if (processedUnprocessedCount >= limit) {
          console.log('Reached the processing limit:', limit);
          break;
        }

        const row = rows[i];
        const gpProcessed = row[row.length - processColumn]; // Check the processed status

        if (gpProcessed === 'processed') {
          console.log('Row already processed, skipping:', i);
          continue; // Skip already processed rows
        }

        console.log('processing row : ', i);
        const processedRow = await processRow(row, columnNames);
        console.log('processedRow : ', processedRow);

        const isExisting = await findExistingCandidate(processedRow);
        if (isExisting) {
          console.log('isExisting');
          await updateExistingCandidate(processedRow, isExisting);
        } else {
          await createCandidate(processedRow);
        }

        // Mark the row as processed
        rows[i][row.length - processColumn] = 'processed';
        processedUnprocessedCount++; // Increment the count of unprocessed rows that were processed
        processedCount++; // Count the total processed
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
        processedUnprocessedCount,
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
    const googleServiceJSON = await readJsonFromS3(
      s3Bucket,
      'google-service-key.json',
    );
    const parsed = JSON.parse(googleServiceJSON);
    const googleServiceKey = parsed.private_key;

    if (!googleServiceKey) {
      throw new Error('No private key found in the service account JSON.');
    }

    const jwtClient = new google.auth.JWT(
      googleServiceEmail,
      null,
      googleServiceKey,
      ['https://www.googleapis.com/auth/spreadsheets'],
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
    if (gpProcessed === 'processed') {
      console.log('already processed', gpProcessed, processColumn);
      return candidate;
    }
    const parsedCandidate = {};

    for (let i = 0; i < columnNames.length; i++) {
      parsedCandidate[columnNames[i]] = candidate[i];
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

async function findExistingCandidate(row) {
  try {
    const { parsedCandidate } = row;
    const { first_name, last_name, office_name, email } = parsedCandidate;
    const slug = slugify(`${first_name}-${last_name}-${office_name}`, {
      lower: true,
    });
    const existing = await BallotCandidate.findOne({ slug });
    if (existing) {
      return existing;
    }

    const existingEmail = await BallotCandidate.findOne({ email });
    if (existingEmail) {
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
    const slug = slugify(
      `${parsedCandidate.first_name}-${parsedCandidate.last_name}-${parsedCandidate.office_name}`,
      {
        lower: true,
      },
    );

    const candidate = await BallotCandidate.create({
      slug,
      firstName: parsedCandidate.first_name,
      lastName: parsedCandidate.last_name,
      email: parsedCandidate.email,
      phone: parsedCandidate.phone,
      state: parsedCandidate.state,
      party: parsedCandidate.party,
      city: parsedCandidate.city,
      electionDay: parsedCandidate.general_election_date,
      raceId: parsedCandidate.ballotready_race_id,
      postalCode: parsedCandidate.postal_code,
      positionName: parsedCandidate.office_name,
      level: parsedCandidate.office_level,
      electionResult: parsedCandidate.election_result,
      isPrimary: parsedCandidate.is_primary === 'TRUE',
      normalizedPositionName: parsedCandidate.office_normalized,
      tier: parsedCandidate.candidate_id_tier,
      vendorTsData: parsedCandidate,
    });

    const ballotRace = await BallotRace.findOne({
      ballotId: parsedCandidate.ballotready_race_id,
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
