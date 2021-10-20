/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Update Candidate',

  description: 'Candidate Manager endpoint to find candidate UGC',

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
      const candidateUgc = await CandidateUgc.find().populate('candidate');
      candidateUgc.forEach(ugc => {
        ugc.data = ugc.data !== '' ? JSON.parse(ugc.data) : {};
        ugc.candidate = JSON.parse(ugc.candidate.data);
      });
      return exits.success({
        ugc: candidateUgc,
      });

      // return exits.success({
      //   candidateUgc: candidateUgc.length === 1 ? candidateUgc[0] : false,
      // });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate content.' });
    }
  },
};
