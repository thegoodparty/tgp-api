/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Update Candidate',

  description: 'Admin endpoint to edit a candidate.',

  inputs: {
    candidate: {
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
      const { candidate } = inputs;
      const { id } = candidate;

      const cleanCandidate = {
        ...candidate,
        firstName: candidate.firstName.trim(),
        lastName: candidate.lastName.trim(),
        chamber: candidate.chamber.trim(),
        isActive: !!candidate.isActive,
      };

      const oldCandidate = await Candidate.findOne({ id });

      const updatedCandidate = await Candidate.updateOne({ id }).set({
        ...cleanCandidate,
      });
      // add the id to the JSON.stringified record
      await Candidate.updateOne({ id: updatedCandidate.id }).set({
        data: JSON.stringify({ ...cleanCandidate, id: updatedCandidate.id }),
      });
      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
    }
  },
};
