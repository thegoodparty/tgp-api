/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const slugify = require('slugify');

module.exports = {
  friendlyName: 'Find Candidate associated with user',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    url: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Created',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
    badRequest: {
      description: 'Login Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, url } = inputs;
      const user = this.req.user;

      const candidate = await Candidate.findOne({ id });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.forbidden();
      }
      const s3Url = await sails.helpers.images.transparentImage(
        url,
        `${slugify(candidate.firstName)}-${slugify(candidate.lastName)}`,
      );

      const data = JSON.parse(candidate.data);
      const newData = { ...data, image: s3Url };
      await Candidate.updateOne({ id }).set({
        data: JSON.stringify(newData),
      });
      await sails.helpers.cacheHelper('clear', 'all');

      return exits.success({
        image: s3Url,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.badRequest();
    }
  },
};
