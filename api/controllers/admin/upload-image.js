module.exports = async function uploadAvatar(req, res) {
  const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;
  await sails.helpers.fileUploader(req.file('files[0]'), `${assetsBase}/candidate-info`);
};
