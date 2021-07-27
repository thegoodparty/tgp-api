const AWS = require('aws-sdk');

module.exports = async function uploadAvatar(req, res) {
  const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
  const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;
  const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;
  const action = req.param('action');
  const name = req.param('name');

  var s3Bucket = new AWS.S3({
    accessKeyId: s3Key,
    secretAccessKey: s3Secret,
    params: {
      Bucket: `${assetsBase}/candidate-info`,
      ACL: 'public-read',
    },
  });
  let response = {
    data: {
      code: 220,
    },
    success: true,
  };
  if (action === 'fileRemove') {
    await sails.helpers.s3DeleteFile(
      `${assetsBase}/candidate-info`,
      `candidate-info/${name}`,
    );
  } else {
    const files = await sails.helpers.s3LoadList(
      `${assetsBase}/candidate-info`,
      'candidate-info',
    );
    response = {
      data: {
        code: 220,
        sources: [
          {
            baseurl: `https://${assetsBase}/candidate-info`,
            files: [],
            path: '',
            name: 'default',
            title: null,
          },
        ],
      },
      success: true,
    };
    files.forEach(file => {
      if (file.Size > 0) {
        response.data.sources[0].files.push({
          file: file.Key.split('/')[1],
          isImage: true,
          size: `${file.Size / 1024} kB`,
          thumb: file.Key.split('/')[1],
        });
      }
    });
  }
  res.ok(response);
};
