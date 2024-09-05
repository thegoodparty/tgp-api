const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

const s3Client = new S3Client({
  region: 'us-west-2',
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
}); // TODO: make region configurable

module.exports = {
  friendlyName: 'Get Upload Url',
  description: 'Get a signed URL to upload a file to S3',
  inputs: {
    fileType: {
      type: 'string',
      required: true,
      description: 'Type of file to upload',
      example: 'image/png',
    },
    fileName: {
      type: 'string',
      required: true,
      description: 'Name of the file to upload',
    },
    bucket: {
      type: 'string',
      required: true,
      description: 'Name of the bucket to upload to',
    },
  },
  exits: {
    success: {
      description: 'Signed URL generated',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error generating signed URL',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    const { fileType, fileName, bucket } = inputs;
    const { success, badRequest } = exits;

    try {
      const bucketPath = bucket.includes('/') ? bucket.split('/')[0] : bucket;
      const filePath = bucket.includes('/')
        ? `${bucket.split('/')[1]}/${fileName}`
        : fileName;
      const command = new PutObjectCommand({
        Bucket: bucketPath,
        Key: filePath,
        ContentType: fileType,
      });

      return success({
        signedUploadUrl: await getSignedUrl(s3Client, command, {
          expiresIn: 3600,
        }),
      });
    } catch (e) {
      console.error('Error generating signed URL', e);
      return badRequest({ message: 'Error generating signed URL' });
    }
  },
};
