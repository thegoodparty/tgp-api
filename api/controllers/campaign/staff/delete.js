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
    candidateId: {
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
    badRequest: {
      description: 'Login Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, candidateId } = inputs;
      const user = this.req.user;
      const candidate = await Candidate.findOne({
        id: candidateId,
      });
      if (!candidate) {
        return exits.notFound(false);
      }
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess) {
        return exits.badRequest(false);
      }

      await Staff.destroyOne({
        candidate: candidateId,
        id,
      });

      return exits.success({ message: 'delete' });
    } catch (e) {
      return exits.badRequest(false);
    }
  },
};
