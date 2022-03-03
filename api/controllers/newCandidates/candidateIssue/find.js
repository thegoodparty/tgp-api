/**
 * candidateIssue/find.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Load Candidate Issue',

  description: 'Candidate Issue endpoint to find candidate issue',

  inputs: {
    candidateId: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'error finding',
      responseType: 'badRequest',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },
  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const { candidateId } = inputs;

      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess) {
        return exits.forbidden();
      }

      const candidateIssues = await CandidateIssueItem.find({
        candidate: candidateId,
        status: 'pending',
      }).populate('topic');
      return exits.success({
        candidateIssue: candidateIssues,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate issue.' });
    }
  },
};
