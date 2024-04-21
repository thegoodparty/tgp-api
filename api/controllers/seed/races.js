const appBase = sails.config.custom.appBase || sails.config.appBase;
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
let files = 3;
if (
  appBase === 'https://goodparty.org' ||
  appBase === 'https://qa.goodparty.org'
) {
  files = 122;
}

module.exports = {
  inputs: {
    startFile: {
      type: 'number',
    },
  },

  exits: {},

  async fn(inputs, exits) {
    try {
      let { startFile } = inputs;
      if (!startFile) {
        startFile = 1;
      }
      for (let i = startFile - 1; i < files; i++) {
        const s3Key = `ballotready_part${i + 1}.csv`;
        console.log('processing file ', s3Key);
        await sails.helpers.slack.errorLoggerHelper('processing file', {
          fileName: s3Key,
        });

        let rows = await readAndProcessCSV(s3Key);
        // await new Promise((resolve) => setTimeout(resolve, 1000));

        for (const row of rows) {
          try {
            await sails.helpers.ballotready.addRace(row);
          } catch (error) {
            console.log('uncaught error adding row', error);
            await sails.helpers.slack.errorLoggerHelper(
              'uncaught error adding race',
              {
                error,
              },
            );
          }
        }
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

async function readAndProcessCSV(s3Key) {
  let rows = [];
  let finished = false;
  const s3Stream = s3
    .getObject({ Bucket: s3Bucket, Key: s3Key })
    .createReadStream();

  s3Stream
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('end', () => {
      // Wait for all row processing to complete
      console.log('CSV file successfully processed');
      finished = true;
    })
    .on('error', (error) => {
      console.log('error reading file', error);
    }); // Handle any stream errors

  console.log('waiting for file to finish processing...');
  while (finished === false) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return rows;
}
