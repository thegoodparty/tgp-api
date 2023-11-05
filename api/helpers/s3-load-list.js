const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'S3 Uploader',

  description: 'List or download files from an S3 Bucket',

  inputs: {
    s3BucketName: {
      friendlyName: 's3 bucket name',
      type: 'string',
    },
    prefix: {
      friendlyName: 's3 bucket prefix',
      type: 'string',
    },
    // if download path is provided, it will download the files to that path.
    downloadPath: {
      friendlyName: 'download path',
      type: 'string',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { s3BucketName, prefix, downloadPath } = inputs;
      const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
      const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;
      // const assetsBase =
      //   sails.config.custom.assetsBase || sails.config.assetsBase;

      console.log('s3BucketName', s3BucketName);
      console.log('prefix', prefix);

      var s3Bucket = new AWS.S3({
        accessKeyId: s3Key,
        secretAccessKey: s3Secret,
        params: { Bucket: s3BucketName, ACL: 'public-read' },
      });
      const response = await s3Bucket
        .listObjects({
          Bucket: s3BucketName,
          Prefix: prefix,
        })
        .promise();
      if (response?.Contents) {
        if (downloadPath) {
          const files = response.Contents;
          for (const file of files) {
            console.log('getting file', file.Key);
            try {
              const data = await s3Bucket
                .getObject({
                  Bucket: s3BucketName,
                  Key: file.Key,
                })
                .promise();
              const filePath = path.resolve(downloadPath, file.Key);
              console.log('deleting files', downloadPath);
              // set the mode to overwrite existing files
              fs.writeFileSync(filePath, data.Body, {
                mode: 0o755,
              });
            } catch (e) {
              console.log('error getting file', e);
            }
          }
          return exits.success('ok');
        } else {
          return exits.success(response.Contents);
        }
      }
      return exits.success([]);
    } catch (e) {
      console.log('error listing to s3', e);
      return exits.badRequest({
        message: 'Error listing to s3',
      });
    }
  },
};
