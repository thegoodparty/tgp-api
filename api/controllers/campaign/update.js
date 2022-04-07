/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    candidate: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Updated',
      responseType: 'ok',
    },
    notFound: {
      description: 'Candidate Not Found.',
      responseType: 'notFound',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id, candidate } = inputs;
      const user = this.req.user;

      const candidateAccess = await Candidate.findOne({
        id,
      });

      try {
        const canAccess = await sails.helpers.staff.canAccess(
          candidateAccess,
          user,
        );
        if (!canAccess) {
          return exits.forbidden();
        }
      } catch (e) {
        return exits.forbidden();
      }

      if (!candidate) {
        return exits.notFound();
      }

      const cleanCandidate = {
        ...candidateAccess,
        firstName: candidate.firstName.trim(),
        lastName: candidate.lastName.trim(),
        state: candidate.state.trim(),
      };
      const { contactName, contactPhone, contactEmail } = candidate;

      const data = {
        ...JSON.parse(candidateAccess.data),
        ...candidate,
        id,
      };

      delete data.contactName;
      delete data.contactPhone;
      delete data.contactEmail;

      await Candidate.updateOne({ id }).set({
        ...cleanCandidate,
        data: JSON.stringify(data),
        contact: { contactName, contactPhone, contactEmail },
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
