/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Update Candidate',

  description: 'Candidate Manager endpoint to find candidate UGC',

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

      const candidateUgc = await CandidateUgc.findOne({
        id,
        status: 'pending',
      });

      const data = JSON.parse(candidateUgc.data);
      const candidate = await Candidate.findOne({ id: candidateUgc.candidate });
      const candidateData = JSON.parse(candidate.data);
      await Candidate.updateOne({ id: candidate.id }).set({
        data: JSON.stringify({
          ...candidateData,
          ...data,
        }),
      });
      await CandidateUgc.updateOne({
        id,
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
