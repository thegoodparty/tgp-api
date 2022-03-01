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
      for (let i = 0; i < data.length; i++) {
        const { topic, positionId, candidate, description, websiteUrl } = data[i];
        const candidateIssueItem = await CandidateIssueItem.findOrCreate(
          {
            topic,
            candidate,
          },
          {
            candidate,
            topic,
          },
        );
        await CandidateIssueItem.updateOne({
          id: candidateIssueItem.id,
        }).set({
          candidate,
          topic,
          positionId,
          description,
          websiteUrl,
          status: 'pending',
        });
      }

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updated candidate issue.' });
    }
  },
};
