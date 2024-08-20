const csv = require('csv-parser');
const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');
const { pipeline } = require('stream');
const { promisify } = require('util');

// Note: this function was moved to a separate repository that uses prisma.

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

const s3Bucket = 'normalized-voter-files';
const s3 = new S3Client({
  region: 'us-west-2',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

module.exports = {
  inputs: {
    startFile: {
      type: 'number',
    },
    maxRows: {
      type: 'number',
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
    try {
      let files = [];
      files = getAllFiles(s3Bucket, 200);
      for (let fileNumber = 0; fileNumber < files.length; fileNumber++) {
        if (startFile && startFile > fileNumber) {
          continue;
        }
        console.log(
          `processing file number ${file} filename ${files[fileNumber]}`,
        );
        try {
          const file = files[fileNumber];
          const objectKey = file?.Key;
          await processVoterFile(objectKey);
        } catch (error) {
          console.log('uncaught error adding voter file', error);
          await sails.helpers.slack.errorLoggerHelper(
            'uncaught error adding voter file',
            error,
          );
        }
      }

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log('error at seed/voters.js');
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('error at seed/voters.js', e);
      return exits.badRequest({
        message: 'unknown error',
      });
    }
  },
};

async function getAllFiles(bucket, maxKeys) {
  try {
    const params = {
      Bucket: bucket,
      MaxKeys: maxKeys,
      path: 'VM2Uniform/',
    };

    const listCommand = new ListObjectsV2Command(params);
    const data = await s3.send(listCommand);
    // Sort the files by LastModified date
    const sortedFiles = data.Contents.sort((a, b) => {
      return new Date(b.LastModified) - new Date(a.LastModified);
    });

    files = [];
    for (let i = 0; i < sortedFiles.length; i++) {
      const key = sortedFiles[i]?.Key;
      if (key?.startsWith('VM2Uniform--')) {
        files.push(key);
      }
    }
    return files;
  } catch (error) {
    console.error('Error fetching files: ', error);
    throw error;
  }
}

async function processBatch(rows) {
  // Replace this with your actual database insertion logic
  console.log(`Writing ${rows.length} rows to the database...`);
  // Simulate asynchronous database operation
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function processVoterFile(s3Key) {
  let buffer = [];
  const batchSize = 10000;
  let batchPromises = [];

  const getObjectCommand = new GetObjectCommand({
    Bucket: s3Bucket,
    Key: s3Key,
  });
  const response = await s3.send(getObjectCommand);
  const s3Stream = response.Body;

  const processStream = async (row) => {
    buffer.push(row);
    if (buffer.length >= batchSize) {
      batchPromises.push(processBatch(buffer.slice()));
      buffer = [];
    }
  };

  const finishProcessing = async () => {
    if (buffer.length > 0) {
      batchPromises.push(processBatch(buffer));
    }
    await Promise.all(batchPromises);
    console.log('CSV file successfully processed');
  };

  const pipelineAsync = promisify(pipeline);

  try {
    await pipelineAsync(
      s3Stream,
      csv({ separator: '\t' }),
      async function* (source) {
        for await (const row of source) {
          yield processStream(row);
        }
      },
    );
    await finishProcessing();
  } catch (error) {
    console.error('Error processing file', error);
  }
}
