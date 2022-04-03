const moment = require('moment');
const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;
const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;

module.exports = {
  friendlyName: 'Upload Image helper',

  inputs: {
    file: {
      required: true,
      type: 'ref',
    },
    bucket: {
      type: 'string',
    },
  },

  fn: async function(inputs, exits) {
    const { file, bucket } = inputs;
    const bucketName = bucket || `${assetsBase}/candidate-info`;

    let response = {
      success: true,
      time: moment().format('YYYY-MM-DD hh:mm:dd'),
      data: {
        baseurl: `https://${assetsBase}/candidate-info/`,
        messages: [],
        files: [],
        isImages: [],
        code: 220,
      },
      elapsedTime: null,
    };
    file.upload(
      {
        adapter: require('skipper-s3'),
        key: s3Key,
        secret: s3Secret,
        bucket: bucketName,
        fileACL: 'public-read',
        headers: {
          'cache-control': 'max-age=31536000',
        },
      },
      function(err, uploadedFiles) {
        uploadedFiles.forEach(file => {
          response.data.files.push(file.fd);
          response.data.isImages.push(true);
        });
        if (!err) {
          return exits.success(response);
        } else {
          console.log('error uploading to s3', err);
          throw new Error('error uploading to s3');
        }
      },
    );
  },
};
