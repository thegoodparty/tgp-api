const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');

module.exports = {
  friendlyName: 'S3 Delete File',

  description: 'Delete a file in an S3 bucket',

  inputs: {
    bucketName: {
      friendlyName: 's3 bucket name',
      type: 'string',
    },
    path: {
      friendlyName: 'path on s3 bucket',
      type: 'string',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { bucketName, path } = inputs;
      const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
      const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;
      const assetsBase =
        sails.config.custom.assetsBase || sails.config.assetsBase;

      var s3Bucket = new S3Client({
        accessKeyId: s3Key,
        secretAccessKey: s3Secret,
      });

      const deleteObjectParams = {
        Bucket: bucketName,
        Key: path,
      };
      const command = new DeleteObjectCommand(deleteObjectParams);
      const response = await s3Bucket.send(command);
      console.log('Delete successful', response);
      return exits.success();
    } catch (e) {
      console.log('error deleting to s3', e);
      return exits.badRequest({
        message: 'Error deleting to s3',
      });
    }
  },
};
