const appBase = sails.config.custom.appBase || sails.config.appBase;
const csv = require('csv-parser');
const AWS = require('aws-sdk');
const crypto = require('crypto');
const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

AWS.config.update({
  region: 'eu-west-2',
  accessKeyId,
  secretAccessKey,
});

const s3Bucket = 'ballotready-chunks';

const s3 = new AWS.S3();

let count = 0;
let files = 3;
if (
  appBase === 'https://goodparty.org' ||
  appBase === 'https://qa.goodparty.org'
) {
  files = 122;
}

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      for (let i = 0; i < files; i++) {
        const s3Key = `ballotready_part${i + 1}.csv`;
        console.log('processing file ', s3Key);
        await sails.helpers.slack.errorLoggerHelper('processing file', {
          fileName: s3Key,
        });
        await readAndProcessCSV(s3Key);
      }
      await sails.helpers.slack.errorLoggerHelper(
        'completed races processing',
        {
          count,
        },
      );
      return exits.success({
        message: `created ${count} entities`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

function readAndProcessCSV(s3Key) {
  return new Promise((resolve, reject) => {
    const s3Stream = s3
      .getObject({ Bucket: s3Bucket, Key: s3Key })
      .createReadStream();

    const promises = [];

    s3Stream
      .pipe(csv())
      .on('data', (row) => {
        // Push the promise of each row processing into an array
        const processRow = async () => {
          try {
            await insertIntoDatabase(row);
          } catch (error) {
            reject(error); // Reject the main promise on any error
          }
        };
        promises.push(processRow());
      })
      .on('end', () => {
        // Wait for all row processing to complete
        Promise.all(promises)
          .then(() => {
            console.log('CSV file successfully processed');
            resolve(); // Resolve the main promise after all rows are processed
          })
          .catch(reject); // Reject the main promise if any of the row processing fails
      })
      .on('error', reject); // Handle any stream errors
  });
}

async function insertIntoDatabase(row) {
  try {
    const {
      position_name,
      state,
      race_id,
      is_primary,
      is_judicial,
      sub_area_name,
      sub_area_value,
      filing_periods,
      election_day,
    } = row;
    const isPrimary = is_primary && is_primary.toLowerCase() === 'true';
    const isJudicial = is_judicial && is_judicial.toLowerCase() === 'true';

    const { name, level } = await sails.helpers.ballotready.extractLocation(
      row,
    );
    // if (name === '') {
    //   console.log('position_name', position_name);
    //   console.log('original level', row.level);
    //   console.log('name', name);
    //   console.log('level', level);
    //   console.log('---');
    // }
    const exists = await BallotRace.findOne({
      ballotId: race_id,
    });
    if (!exists && name !== '') {
      const hashId = await randomHash();
      const dates = extractDates(filing_periods);
      if (dates) {
        row.filing_date_start = dates.startDate;
        row.filing_date_end = dates.endDate;
      }
      const electionDate = election_day ? new Date(election_day).getTime() : 0;

      if (level === 'county') {
        const countyExists = await County.findOne({
          name,
          state,
        });
        if (countyExists) {
          await BallotRace.create({
            hashId,
            ballotId: race_id,
            state,
            data: row,
            county: countyExists.id,
            level,
            isPrimary,
            isJudicial,
            subAreaName: sub_area_name,
            subAreaValue: sub_area_value,
            electionDate,
          });
          count++;
        }
      } else if (level === 'state' || level === 'federal') {
        await BallotRace.create({
          hashId,
          ballotId: race_id,
          state,
          data: row,
          level,
          isPrimary,
          isJudicial,
          subAreaName: sub_area_name,
          subAreaValue: sub_area_value,
          electionDate,
        });
        count++;
      } else {
        const municipalityExists = await Municipality.findOne({
          name,
          state,
        });
        if (municipalityExists) {
          await BallotRace.create({
            hashId,
            ballotId: race_id,
            state,
            data: row,
            municipality: municipalityExists.id,
            level,
            isPrimary,
            isJudicial,
            subAreaName: sub_area_name,
            subAreaValue: sub_area_value,
            electionDate,
          });
          count++;
        }
      }
    }
  } catch (e) {
    console.log('error in insertIntoDb', e);
  }
}

async function randomHash() {
  const hashId = crypto.randomBytes(3).toString('hex').substr(0, 8);
  const existing = await BallotRace.findOne({ hashId });
  if (existing) {
    console.log('duplicate hash', hashId);
    return await randomHash();
  }
  return hashId;
}

function extractDates(str) {
  // the string format is [{"notes"=>nil, "end_on"=>"2024-05-10", "start_on"=>"2024-05-06"}] or []
  // Replace '=>' with ':' to make it a valid JSON string
  if (!str || str === '' || str === '[]') {
    return false;
  }
  try {
    let validJsonString = str.replace(/=>/g, ':');
    validJsonString = validJsonString.replace(/nil/g, 'null');

    // Parse the string as JSON
    const jsonObject = JSON.parse(validJsonString);

    // Extract the 'start_on' and 'end_on' dates
    const startDate = jsonObject[0].start_on;
    const endDate = jsonObject[0].end_on;

    return { startDate, endDate };
  } catch (e) {
    console.log('error', e);
    return false;
  }
}
