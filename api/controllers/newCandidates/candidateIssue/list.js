/**
 * newCandidates/candidateIssue/list.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Find candidate issue',

  description: 'Candidate Manager endpoint to find candidate issue',

  inputs: {},

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
      const candidateIssues = await CandidateIssue.find({
        status: 'pending',
      }).populate('candidate');
      candidateIssues.forEach(issue => {
        issue.data = issue.data !== '' ? issue.data : {};
        issue.candidate = JSON.parse(issue.candidate.data);
      });
      return exits.success({
        topIssues: candidateIssues,
      });

    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate content.' });
    }
  },
};
