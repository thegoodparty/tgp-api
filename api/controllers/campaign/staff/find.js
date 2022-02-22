/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Find role associated with user and candidate',

  inputs: {
    id: {
      type: 'number',
      required: true,
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
      const { id } = inputs;
      const user = this.req.user;
      const candidate = await Candidate.findOne({
        id,
      });
      if (!candidate) {
        return exits.success(false);
      }
      const role = await sails.helpers.staff.canAccess(candidate, user);
      if (!role) {
        return exits.success(false);
      }

      return exits.success(role);
    } catch (e) {
      return exits.success(false);
    }
  },
};
