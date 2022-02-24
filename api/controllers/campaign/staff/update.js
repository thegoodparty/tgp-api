/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Find role associated with user and candidate',

  inputs: {
    userId: {
      type: 'number',
      required: true,
    },
    candidateId: {
      type: 'number',
      required: true,
    },
    role: {
      type: 'string',
      required: true,
      isIn: ['manager', 'staff'],
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
      const { userId, candidateId, role } = inputs;
      const user = this.req.user;
      const candidate = await Candidate.findOne({
        id: candidateId,
      });
      if (!candidate) {
        return exits.success(false);
      }
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess || canAccess === 'staff') {
        return exits.success(false);
      }

      await Staff.updateOne({
        candidate: candidateId,
        user: userId,
      }).set({
        role,
      });

      return exits.success({ message: 'updated' });
    } catch (e) {
      return exits.success(false);
    }
  },
};
