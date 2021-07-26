/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

const fileExt = 'jpeg';

module.exports = {
  friendlyName: 'Update Candidate',

  description: 'Admin endpoint to edit a candidate.',

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
      const { id } = candidate;

      await uploadComparedImage(candidate);
      delete candidate.imageBase64;

      await Candidate.updateOne({ id }).set({
        ...candidate,
        data: JSON.stringify(candidate),
      });

      return exits.success({
        candidate,
      });
    } catch (e) {
      console.log('error at newCandidates/compared/update', e);
      return exits.badRequest({ message: 'Error updating candidate.' });
    }
  },
};
const uploadComparedImage = async candidate => {
  const { comparedCandidates } = candidate;
  if (!comparedCandidates) {
    return;
  }
  const { uploadedImages, candidates } = comparedCandidates;
  if (!uploadedImages) {
    return;
  }
  const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;

  for (let i = 0; i < candidates.length; i++) {
    if (uploadedImages[i]) {
      const { base64 } = uploadedImages[i];
      if (base64) {
        const uuid = Math.random()
          .toString(36)
          .substring(2, 8);
        const cleanBase64 = base64.replace(/^data:image\/.*;base64,/, '');

        const fileName = `${candidates[i].name}-${uuid}.${fileExt}`;
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
        candidates[i].image = `https://${assetsBase}/candidates/${fileName}`;
      }
    }
  }
  delete comparedCandidates.uploadedImages;
};
