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
    forbidden: {
      description: 'Bad token',
      responseType: 'forbidden',
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
        return exits.forbidden();
      }
      const role = await sails.helpers.staff.canAccess(candidate, user);
      if (!role || role === 'staff') {
        return exits.forbidden();
      }
      const staff = await Staff.find({
        candidate: id,
      }).populate('user');

      return exits.success({ staff });
    } catch (e) {
      return exits.forbidden();
    }
  },
};
