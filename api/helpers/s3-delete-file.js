const AWS = require('aws-sdk');

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

      var s3Bucket = new AWS.S3({
        accessKeyId: s3Key,
        secretAccessKey: s3Secret,
        params: { Bucket: bucketName, ACL: 'public-read' },
      });
      return new Promise((resolve, reject) => {
        s3Bucket.deleteObject(
          {
            Bucket: assetsBase,
            Key: path,
          },
          function (err, data) {
            if (!err) {
              return exits.success();
            } else {
              console.log('error deleting to s3', err);
              return exits.badRequest({
                message: 'Error deleting to s3',
              });
              reject();
            }
          },
        );
      });
    } catch (e) {
      console.log('error deleting to s3', e);
      return exits.badRequest({
        message: 'Error deleting to s3',
      });
    }
  },
};
