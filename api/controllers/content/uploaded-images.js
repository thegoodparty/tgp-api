const AWS = require('aws-sdk');

module.exports = async function uploadAvatar(req, res) {
  const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
  const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;

  var s3Bucket = new AWS.S3({
    accessKeyId: s3Key,
    secretAccessKey: s3Secret,
    params: {
      Bucket: 'assets.thegoodparty.org/candidate-info',
      ACL: 'public-read',
    },
  });
  s3Bucket.listObjects({ 
    Bucket: 'assets.thegoodparty.org', 
    Prefix: 'candidate-info' 
  }, function (err, data) {
    let response = {
      data: {
        code: 220,
        sources: {
          default: {
            baseurl: 'https://assets.thegoodparty.org/candidate-info',
            files: [],
            path: ""
          }
        }
      },
      success: true
    }
    if (!err) {
      data.Contents.forEach(file => {
        if (file.Size > 0) {
          response.data.sources.default.files.push({
            file: file.Key.split('/')[1],
            isImage: true,
            size: `${file.Size / 1024} kB`,
            thumb: file.Key.split('/')[1],
          })
        }
      });
    }
    res.ok(response)
  });
};