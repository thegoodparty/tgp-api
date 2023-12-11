const appBase = sails.config.custom.appBase || sails.config.appBase;
const fs = require('fs');
const csv = require('csv-parser');
const AWS = require('aws-sdk');
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
let files = 5;
if (
  appBase === 'https://goodparty.org' ||
  appBase === 'https://qa.goodparty.org'
) {
  files = 61;
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
            await insertCountyIntoDatabase(row);
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

async function insertCountyIntoDatabase(row) {
  try {
    const { position_name, state, race_id } = row;

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
      if (level === 'county') {
        const countyExists = await County.findOne({
          name,
          state,
        });
        if (countyExists) {
          await BallotRace.create({
            ballotId: race_id,
            state,
            data: row,
            county: countyExists.id,
          });
          count++;
        }
      } else if (level === 'state') {
        await BallotRace.create({
          ballotId: race_id,
          state,
          data: row,
        });
        count++;
      } else {
        const municipalityExists = await Municipality.findOne({
          name,
          state,
        });
        if (municipalityExists) {
          await BallotRace.create({
            ballotId: race_id,
            state,
            data: row,
            municipality: municipalityExists.id,
          });
          count++;
        }
      }
    }
  } catch (e) {
    console.log('error in insertIntoDb', e);
  }
}
