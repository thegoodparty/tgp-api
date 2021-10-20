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
      const { user } = this.req;

      const candidateUgc = await CandidateUgc.findOne({
        candidate: user.candidate,
      });
      if (candidateUgc) {
        return exits.success({
          candidateUgc: JSON.parse(candidateUgc.data),
        });
      } else {
        return exits.success({
          candidateUgc: false,
        });
      }

      // return exits.success({
      //   candidateUgc: candidateUgc.length === 1 ? candidateUgc[0] : false,
      // });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate content.' });
    }
  },
};
