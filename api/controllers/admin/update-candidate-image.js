module.exports = async function uploadAvatar(req, res) {
  const id = req.param('id');
  const chamber = req.param('chamber');
  const isIncumbent = req.param('isIncumbent');
  const base64Avatar = req.param('base64');
  const fileExt = 'jpeg';
  const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;

  if (!base64Avatar || !id) {
    return res.badRequest({
      message: 'id and base64 are required.',
    });
  }

  const cleanBase64 = base64Avatar.replace(/^data:image\/.*;base64,/, '');
  

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
    ContentEncoding: 'base64',
    ContentType: `image/${fileExt}`,
  };
  await sails.helpers.s3Uploader(data, `${assetsBase}/candidates`, cleanBase64);
  const image = `https://${assetsBase}/candidates/${fileName}`;
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
