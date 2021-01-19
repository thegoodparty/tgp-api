/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Create Candidate',

  description: 'Admin endpoint to create a candidate.',

  inputs: {
    candidate: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'User Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'register Failed',
      responseType: 'badRequest',
    },
  },
  fn: async function(inputs, exits) {
    try {
      const fileExt = 'jpeg';
      const { candidate } = inputs;
      const { imageBase64 } = candidate;

      const name = `${candidate.firstName
        .toLowerCase()
        .replace(/ /g, '-')}-${candidate.lastName
        .toLowerCase()
        .replace(/ /g, '-')}`;
      // upload the image
      let image;
      if (imageBase64) {
        const assetsBase =
          sails.config.custom.assetsBase || sails.config.assetsBase;
        const cleanBase64 = imageBase64.replace(/^data:image\/.*;base64,/, '');
        const uuid = Math.random()
          .toString(36)
          .substring(2, 8);

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

      const cleanCandidate = {
        ...candidate,
        image,
      };

      delete cleanCandidate.imageBase64;

      const newCandidate = await Candidate.create({
        firstName: cleanCandidate.firstName,
        lastName: cleanCandidate.lastName,
        isActive: true,
        chamber: cleanCandidate.chamber,
      }).fetch();
      // add the id to the JSON.stringified record
      await Candidate.updateOne({ id: newCandidate.id }).set({
        data: JSON.stringify({ ...cleanCandidate, id: newCandidate.id }),
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
