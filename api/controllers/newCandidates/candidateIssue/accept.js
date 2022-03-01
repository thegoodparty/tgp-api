/**
 * newCandidates/candidateIssue/accept.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Accept Candidate Issue',

  description: 'Candidate Manager endpoint to accept candidate issue',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'accepted',
      responseType: 'ok',
    },
    badRequest: {
      description: 'error finding',
      responseType: 'badRequest',
    },
  },
  async fn(inputs, exits) {
    try {
      const { id } = inputs;

      await CandidateIssueItem.update({
        candidate: id,
        status: 'pending'
      }).set({
        status: 'accepted',
      });

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate content.' });
    }
  },
};
