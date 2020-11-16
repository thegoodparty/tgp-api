module.exports = {
  friendlyName: 'S3 Uploader',

  description:
    'Send email via mailgun. https://github.com/auth0/node-jsonwebtoken',

  inputs: {
    file: {
      friendlyName: 'key, body, content encoding, content type',
      type: 'ref',
    },
    bucketName: {
      friendlyName: 's3 bucket name',
      type: 'string',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { file, bucketName } = inputs;
      const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
      const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;
      file.upload({
        adapter: require('skipper-s3'),
        key: s3Key,
        secret: s3Secret,
        bucket: bucketName,
        fileACL: 'public-read'
      }, function (err, uploadedFiles) {
        console.log(err, uploadedFiles)
        if (!err) {
          return exits.success();
        }
        else {
          console.log('error uploading to s3', err);
          return exits.badRequest({
            message: 'Error uploading to s3',
          });
        }
      });
    } catch (e) {
      console.log('error uploading to s3', e);
      return exits.badRequest({
        message: 'Error uploading to s3',
      });
    }
  },
};
