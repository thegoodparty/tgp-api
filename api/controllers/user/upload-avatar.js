/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Upload Avatar',

  inputs: {
    imageBase64: {
      type: 'string',
      required: true,
    },
  },

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
      const user = this.req.user;
      const fileExt = 'jpeg';
      const { imageBase64 } = inputs;

      const assetsBase =
        sails.config.custom.assetsBase || sails.config.assetsBase;
      const cleanBase64 = imageBase64.replace(/^data:image\/.*;base64,/, '');
      const uuid = Math.random()
        .toString(36)
        .substring(2, 8);

      const fileName = `user-${uuid}.${fileExt}`;

      const data = {
        Key: fileName,
        ContentEncoding: 'base64',
        ContentType: `image/${fileExt}`,
      };
      await sails.helpers.s3Uploader(
        data,
        `${assetsBase}/uploads`,
        cleanBase64,
      );
      const avatar = `https://${assetsBase}/uploads/${fileName}`;
      const updatedUser = await User.updateOne({ id: user.id }).set({
        avatar,
      });

      return exits.success({
        user: updatedUser,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
    }
  },
};
