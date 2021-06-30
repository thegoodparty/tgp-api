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
      console.log('after', candidate);

      await Candidate.updateOne({ id }).set({
        ...candidate,
        data: JSON.stringify(candidate),
      });

      return exits.success({
        candidate,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updating candidate.' });
    }
  },
};
const uploadComparedImage = async candidate => {
  console.log('upload1');
  const { comparedCandidates } = candidate;
  console.log('upload2');
  if (!comparedCandidates) {
    return;
  }
  console.log('upload3');
  const { uploadedImages, candidates } = comparedCandidates;
  if (!uploadedImages) {
    return;
  }
  console.log('upload4');
  const assetsBase = sails.config.custom.assetsBase || sails.config.assetsBase;

  for (let i = 0; i < candidates.length; i++) {
    if (uploadedImages[i]) {
      console.log('upload5');
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
