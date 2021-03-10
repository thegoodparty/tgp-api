/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const request = require('request-promise');

module.exports = {
  friendlyName: 'Find by id one Candidate',

  description: 'Find by id one Candidate ',

  inputs: {
    id: {
      type: 'string',
      required: true,
    },
    withImage: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'Candidate Found',
      responseType: 'ok',
    },
    notFound: {
      description: 'Candidate Not Found.',
      responseType: 'notFound',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, withImage } = inputs;
      const candidate = await Candidate.findOne({ id, isActive: true  });
      if (!candidate) {
        return exits.notFound();
      }
      let imageAsBase64;
      const data = JSON.parse(candidate.data);
      if (withImage && data.image) {
        const imageData = await request.get(data.image, { encoding: null });
        imageAsBase64 = Buffer.from(imageData).toString('base64');
      }

      return exits.success({
        candidate: JSON.parse(candidate.data),
        imageAsBase64,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
