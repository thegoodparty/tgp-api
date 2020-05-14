const AWS = require('aws-sdk');

module.exports = {
  friendlyName: 'S3 Uploader',

  description:
    'Send email via mailgun. https://github.com/auth0/node-jsonwebtoken',

  inputs: {
    data: {
      friendlyName: 'key, body, content encoding, content type',
      type: 'json',
    },
    bucketName: {
      friendlyName: 's3 bucket name',
      type: 'string',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { data, bucketName } = inputs;
      const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
      const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;

      var s3Bucket = new AWS.S3({
        accessKeyId: s3Key,
        secretAccessKey: s3Secret,
        params: { Bucket: bucketName, ACL: 'public-read' },
      });
      return new Promise((resolve, reject) => {
        s3Bucket.putObject(data, function(err, data2) {
          if (err) {
            console.log('error uploading to s3', err);
            return exits.badRequest({
              message: 'Error uploading to s3',
            });
            reject();
          } else {
            return exits.success();
          }
        });
      });
    } catch (e) {
      console.log('error uploading to s3', e);
      return exits.badRequest({
        message: 'Error uploading to s3',
      });
    }
  },
};
