const fs = require('fs');
const skipperS3 = require('skipper-s3');

const key = sails.config.custom.s3Key || sails.config.s3Key;
const secret = sails.config.custom.s3Secret || sails.config.s3Secret;

const uploadSingleFileToS3 = async function({
  file, bucket, fileName = '', headers = {},
}) {
  if (!file) {
    const e = new Error('No File provided');
    sails.log.error(e);
    return exits.failure(e);
  }
  if (!bucket) {
    const e = new Error('No S3 bucket path provided');
    sails.log.error(e);
    return exits.failure(e);
  }
  return new Promise((resolve, reject) => {
    file.upload({
      adapter: skipperS3,
      key,
      secret,
      bucket,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Cache-Control': 'max-age=31536000',
        ...headers,
      },
      //Override the filename for easy lookup later
      saveAs: (file, cb) => cb(null, fileName || file.filename),
    }, (err, uploadedFiles) => {
      if (err) {
        return reject(err);
      }
      const [uploadedFile] = uploadedFiles;
      return resolve(uploadedFile);
    });
  });
};

module.exports = {
  uploadSingleFileToS3,
};
