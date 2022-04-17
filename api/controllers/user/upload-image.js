const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;
module.exports = {
  friendlyName: 'Upload Avatar',

  exits: {
    success: {
      description: 'Avatar uploaded',
      responseType: 'ok',
    },
    badRequest: {
      description: 'user upload failed',
      responseType: 'badRequest',
    },
  },
  fn: async function(inputs, exits) {
    try {
      const file = this.req.file('files[0]');
      const { user } = this.req;
      const bucket = `${assetsBase}/uploads`;
      const response = await sails.helpers.images.uploadImage(file, bucket);
      const avatar = `https://${bucket}/${response.data.files[0]}`;
      const updatedUser = await User.updateOne({ id: user.id }).set({
        avatar,
      });
      return exits.success({ ...response, updatedUser });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
    }
  },
};
