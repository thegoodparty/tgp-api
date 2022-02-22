/**
 * candidateIssue/update.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Update Candidate Issue',

  description: 'Candidate Issue endpoint to edit candidate issue',

  inputs: {
    data: {
      type: 'json',
      required: true,
    },
    candidateId: {
      type: 'string',
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
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },
  async fn(inputs, exits) {
    try {
      const { user } = this.req;
      const { data, candidateId } = inputs;
      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess) {
        return exits.forbidden();
      }
      const candidateIssue = await CandidateIssue.findOrCreate(
        {
          candidate: candidateId,
        },
        {
          candidate: candidateId,
        },
      );
      await CandidateIssue.updateOne({
        id: candidateIssue.id,
      }).set({
        data,
        status: 'pending',
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate issue.' });
    }
  },
};
