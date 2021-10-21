/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Update Candidate',

  description: 'Candidate Manager endpoint to edit a candidate.',

  inputs: {
    data: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Candidate Update',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Candidate update Failed',
      responseType: 'badRequest',
    },
  },
  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const { data } = inputs;
      const candidateUgc = await CandidateUgc.findOrCreate(
        {
          candidate: user.candidate,
        },
        {
          candidate: user.candidate,
        },
      );

      await CandidateUgc.updateOne({
        id: candidateUgc.id,
      }).set({
        data: JSON.stringify(data),
        status: 'pending',
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate content.' });
    }
  },
};
