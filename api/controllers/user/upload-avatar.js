const AWS = require('aws-sdk');

module.exports = async function uploadAvatar(req, res) {
  const base64Avatar = req.param('avatar');
  const fileExt = req.param('fileExt');
  if (!base64Avatar || !fileExt) {
    return res.badRequest({
      message: 'avatar and fileExt are required.',
    });
  }

  const cleanBase64 = base64Avatar.replace(
    /^data:image\/[a-z=\;\.]+;base64,/,
    '',
  );
  const buf = new Buffer(cleanBase64, 'base64');
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

  await uploadToS3(data);
  const user = await User.updateOne({ id: req.user.id }).set({
    avatar: `https://s3-us-west-2.amazonaws.com/uploads.thegoodparty.org/${fileName}`,
  });

  const userWithZip = await User.findOne({ id: req.user.id });
  const zipCode = await ZipCode.findOne({
    id: user.zipCode,
  }).populate('cds');
  user.zipCode = zipCode;

  return res.ok({
    user: userWithZip,
  });
};

const uploadToS3 = data => {
  const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
  const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;

  var s3Bucket = new AWS.S3({
    accessKeyId: s3Key,
    secretAccessKey: s3Secret,
    params: { Bucket: 'uploads.thegoodparty.org', ACL: 'public-read' },
  });
  return new Promise((resolve, reject) => {
    s3Bucket.putObject(data, function(err, data) {
      if (err) {
        console.log(err);
        console.log('Error uploading data: ', data);
        // return res.badRequest({
        //   message: 'Error uploading data.',
        // });
        reject();
      } else {
        console.log('succesfully uploaded the image!');
        resolve();
      }
    });
  });
};
