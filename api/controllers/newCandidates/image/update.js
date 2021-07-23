/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const fileExt = 'jpeg';

module.exports = {
  friendlyName: 'Update Candidate Image',

  inputs: {
    candidate: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Candidate Update',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Candidate update Failed',
      responseType: 'badRequest',
    },
  },
  fn: async function(inputs, exits) {
    try {
      const { candidate } = inputs;
      const { imageBase64, id } = candidate;
      const name = `${candidate.firstName
        .toLowerCase()
        .replace(/ /g, '-')}-${candidate.lastName
        .toLowerCase()
        .replace(/ /g, '-')}`;
      // upload the image
      let { image } = candidate;
      const assetsBase =
        sails.config.custom.assetsBase || sails.config.assetsBase;
      const uuid = Math.random()
        .toString(36)
        .substring(2, 8);
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/.*;base64,/, '');

        const fileName = `${name}-${uuid}.${fileExt}`;

        const data = {
          Key: fileName,
          ContentEncoding: 'base64',
          ContentType: `image/${fileExt}`,
          CacheControl: 'max-age=31536000',
        };
        await sails.helpers.s3Uploader(
          data,
          `${assetsBase}/candidates`,
          cleanBase64,
        );
        image = `https://${assetsBase}/candidates/${fileName}`;
      }

      // add the id to the JSON.stringified record
      const updated = await Candidate.updateOne({ id }).set({
        data: JSON.stringify({ ...candidate, image }),
      });
      return exits.success({
        candidate: updated,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
    }
  },
};
