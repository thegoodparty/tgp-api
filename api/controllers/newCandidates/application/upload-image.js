module.exports = async function uploadAvatar(req, res) {
  const file = req.file('files[0]');
  try {
    const response = await sails.helpers.uploadImage(file);
    return res.ok(response);
  } catch (e) {
    console.log('error uploading image', e);
    return res.badRequest('error uploading image');
  }
};
