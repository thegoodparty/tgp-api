const AWS = require('aws-sdk');

module.exports = {
  friendlyName: 'S3 Uploader',

  description:
    'Send email via mailgun. https://github.com/auth0/node-jsonwebtoken',

  inputs: {
    bucketName: {
      friendlyName: 's3 bucket name',
      type: 'string',
    },
    prefix: {
      friendlyName: 's3 bucket name',
      type: 'string',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { bucketName, prefix } = inputs;
      const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
      const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;
      const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;

      var s3Bucket = new AWS.S3({
        accessKeyId: s3Key,
        secretAccessKey: s3Secret,
        params: { Bucket: bucketName, ACL: 'public-read' },
      });
      return new Promise((resolve, reject) => {
        s3Bucket.listObjects({
          Bucket: assetsBase,
          Prefix: prefix
        }, function (err, data) {
          if (!err) {
            return exits.success(data.Contents);
          }
          else {
            console.log('error listing to s3', err);
            return exits.badRequest({
              message: 'Error listing to s3',
            });
            reject();
          }
        });
      });
    } catch (e) {
      console.log('error listing to s3', e);
      return exits.badRequest({
        message: 'Error listing to s3',
      });
    }
  },
};
