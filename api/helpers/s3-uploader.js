const AWS = require('aws-sdk');
const { isBuffer } = require('lodash');

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
    base64: {
      friendlyName: 'receive base64 data because helper function avoid buffer',
      type: 'string',
    },
    isBuffer: {
      type: 'boolean',
    },
  },

  fn: async function(inputs, exits) {
    try {
      let { data, bucketName, base64, isBuffer } = inputs;
      const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
      const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;

      var s3Bucket = new AWS.S3({
        accessKeyId: s3Key,
        secretAccessKey: s3Secret,
        params: { Bucket: bucketName, ACL: 'public-read' },
      });
      if (!data.Body) {
        data.Body = new Buffer(base64, 'base64');
      }
      if (isBuffer) {
        data.Body = new Buffer(JSON.parse(data.Body));
      }
      return new Promise((resolve, reject) => {
        s3Bucket.putObject(data, function(err, data2) {
          if (err) {
            console.log('error uploading to s3', err);
            reject();
          } else {
            return exits.success();
          }
        });
      });
    } catch (e) {
      console.log('error uploading to s3', e);
      throw new Error('error uploading to s3');
    }
  },
};
