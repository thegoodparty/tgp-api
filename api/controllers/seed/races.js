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
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const s3Key = 'ballotready_part25.csv';
      readAndProcessCSV(s3Key);
      return exits.success({
        message: `done`,
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
  const s3Stream = s3
    .getObject({ Bucket: s3Bucket, Key: s3Key })
    .createReadStream();

  s3Stream
    .pipe(csv())
    .on('data', (row) => {
      // Immediately invoked async function to handle each row
      (async () => {
        await insertCountyIntoDatabase(row);
      })();
    })
    .on('end', () => {
      console.log('CSV file successfully processed');
    });
}

async function insertCountyIntoDatabase(row) {
  try {
    const { position_name } = row;

    const { name, level } = await sails.helpers.ballotready.extractLocation(
      row,
    );
    if (name === '') {
      console.log('position_name', position_name);
      console.log('original level', row.level);
      console.log('name', name);
      console.log('level', level);
      console.log('---');
    }

    // console.log('county', county);
    // console.log('state_id', state_id);
    // const exists = await County.findOne({
    //   name: county,
    //   state: state_id,
    // });
    // if (!exists) {
    //   await County.create({
    //     name: county,
    //     state: state_id,
    //     data: row,
    //   });
    //   count++;
    // }
  } catch (e) {
    console.log('error in insertIntoDb', e);
  }
}
