module.exports = async function uploadAvatar(req, res) {
  const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
  const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;
  req.file('files[0]').upload({
    adapter: require('skipper-s3'),
    key: s3Key,
    secret: s3Secret,
    bucket: 'assets.thegoodparty.org/candidate-info',
    fileACL: 'public-read'
  }, function (err, uploadedFiles) {
    console.log(err, uploadedFiles)
    if (!err) {
      const image = `https://assets.thegoodparty.org/candidate-info/${uploadedFiles[0].fd}`;
      res.ok({
        image
      })
    }
  });
};
