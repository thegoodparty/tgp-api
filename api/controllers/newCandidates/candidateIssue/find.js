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
  },
  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const { candidateId } = inputs;

      const candidateIssue = await CandidateIssue.findOne({
        candidate: candidateId || user.candidate,
        status: 'pending'
      });
      if (candidateIssue) {
        return exits.success({
          candidateIssue: candidateIssue.data,
        });
      } else {
        return exits.success({
          candidateIssue: false,
        });
      }
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate issue.' });
    }
  },
};
