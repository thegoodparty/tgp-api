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
        };
        await sails.helpers.s3Uploader(
          data,
          `${assetsBase}/candidates`,
          cleanBase64,
        );
        image = `https://${assetsBase}/candidates/${fileName}`;
      }
      await uploadComparedImage(candidate);

      const cleanCandidate = {
        ...candidate,
        image,
      };

      delete cleanCandidate.imageBase64;

      const updatedCandidate = await Candidate.updateOne({ id }).set({
        ...cleanCandidate,
      });
      // add the id to the JSON.stringified record
      await Candidate.updateOne({ id: updatedCandidate.id }).set({
        data: JSON.stringify({ ...cleanCandidate, id: updatedCandidate.id }),
      });

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
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
