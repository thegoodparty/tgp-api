const AWS = require('aws-sdk');

module.exports = async function uploadAvatar(req, res) {
  const base64Avatar = req.param('avatar');
  const fileExt = req.param('fileExt');
  if (!base64Avatar || !fileExt) {
    return res.badRequest({
      message: 'avatar and fileExt are required.',
    });
  }

  const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
  const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;

  var s3Bucket = new AWS.S3({
    accessKeyId: s3Key,
    secretAccessKey: s3Secret,
    params: { Bucket: 'uploads.thegoodparty.org', ACL: 'public-read' },
  });

  const buf = new Buffer(base64Avatar, 'base64');
  const uuid =
    Math.random()
      .toString(36)
      .substring(2, 15) +
    Math.random()
      .toString(36)
      .substring(2, 15);
  const fileName = `${uuid}-310${req.user.id}.${fileExt}`;
  const data = {
    Key: fileName,
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: `image/${fileExt}`,
  };
  s3Bucket.putObject(data, function(err, data) {
    if (err) {
      console.log(err);
      console.log('Error uploading data: ', data);
      // return res.badRequest({
      //   message: 'Error uploading data.',
      // });
    } else {
      console.log('succesfully uploaded the image!');
      // return res.ok();
    }
  });
  const user = await User.updateOne({ id: req.user.id }).set({
    avatar: `https://s3-us-west-2.amazonaws.com/uploads.thegoodparty.org/${fileName}`,
  });
  const userWithZip = await User.findOne({ id: req.user.id })
    .populate('zipCode')
    .populate('congDistrict');

  return res.ok({
    user: userWithZip,
  });

  // console.log(req.param('avatar'));

  // console.log(req.file('avatar'));
  /*
  req.file('avatar').upload(
    // {
    //   adapter: require('skipper-s3'),
    //   key: s3Key,
    //   secret: s3Secret,
    //   bucket: 'uploads.thegoodparty.org',
    // },
    function(err, filesUploaded) {
      console.log('uploadAvatar2');
      if (err) {
        console.log('Error', err);
        return res.serverError(err);
      }
      console.log('filesUploaded', filesUploaded);
      console.log('req.allParams()', req.allParams());

      return res.ok({
        files: filesUploaded,
        textParams: req.allParams(),
      });
    },
  );
  */
};
