const moment = require('moment');
module.exports = async function uploadAvatar(req, res) {
  const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;
  const file = req.file('files[0]');
  const bucketName = `${assetsBase}/candidate-info`;
  const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
  const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;
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
        'cache-control': 'max-age=31536000'
      }
    },
    function(err, uploadedFiles) {
      console.log(err, uploadedFiles);
      uploadedFiles.forEach(file => {
        response.data.files.push(file.fd);
        response.data.isImages.push(true);
      })
      if (!err) {
        return res.ok(response);
      } else {
        console.log('error uploading to s3', err);
      }
    },
  );
};
