const AWS = require('aws-sdk');

module.exports = async function uploadAvatar(req, res) {
  const id = req.param('id');
  const chamber = req.param('chamber');
  const isIncumbent = req.param('isIncumbent');
  const base64Avatar = req.param('base64');
  const fileExt = 'jpeg';

  if (!base64Avatar || !id) {
    return res.badRequest({
      message: 'id and base64 are required.',
    });
  }

  const cleanBase64 = base64Avatar.replace(/^data:image\/.*;base64,/, '');
  const buf = new Buffer(cleanBase64, 'base64');

  let candidate;
  if (chamber === 'presidential') {
    candidate = await PresidentialCandidate.findOne({
      id,
    });
  } else if (isIncumbent) {
    candidate = await Incumbent.findOne({
      id,
    });
    candidate.isIncumbent = true;
  } else {
    candidate = await RaceCandidate.findOne({
      id,
    });
  }
  const name = candidate.name.toLowerCase().replace(/ /g, '-');
  const uuid = Math.random()
    .toString(36)
    .substring(2, 8);

  const fileName = `${name}-${candidate.id}-${uuid}.${fileExt}`;

  const data = {
    Key: fileName,
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: `image/${fileExt}`,
  };
  // await sails.helpers.s3Uploader(data, 'assets.thegoodparty.org/candidates');
  await uploadToS3(data);
  const image = `https://assets.thegoodparty.org/candidates/${fileName}`;
  if (chamber === 'presidential') {
    candidate = await PresidentialCandidate.updateOne({
      id,
    }).set({ image });
  } else if (isIncumbent) {
    candidate = await Incumbent.updateOne({
      id,
    }).set({ image });
    candidate.isIncumbent = true;
  } else {
    candidate = await RaceCandidate.updateOne({
      id,
    }).set({ image });
  }

  const { state, district } = candidate || {};
  const incumbent = await sails.helpers.incumbentByDistrictHelper(
    state,
    district,
  );
  let incumbentRaised = 50000000;
  if (chamber !== 'presidential') {
    if (candidate.isIncumbent) {
      incumbentRaised = candidate.raised;
    } else {
      incumbentRaised = incumbent
        ? incumbent.raised || incumbent.combinedRaised
        : false;
      incumbentRaised = incumbentRaised ? incumbentRaised / 2 : false;
    }
  }

  const { isGood, isBigMoney, isMajor } = await sails.helpers.goodnessHelper(
    candidate,
    chamber,
    incumbentRaised,
  );
  candidate.isGood = isGood;
  candidate.isBigMoney = isBigMoney;
  candidate.isMajor = isMajor;

  return res.ok({
    candidate,
  });
};

const uploadToS3 = data => {
  const s3Key = sails.config.custom.s3Key || sails.config.s3Key;
  const s3Secret = sails.config.custom.s3Secret || sails.config.s3Secret;

  var s3Bucket = new AWS.S3({
    accessKeyId: s3Key,
    secretAccessKey: s3Secret,
    params: {
      Bucket: 'assets.thegoodparty.org/candidates',
      ACL: 'public-read',
    },
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
        resolve();
      }
    });
  });
};
