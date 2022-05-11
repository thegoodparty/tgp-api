/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */
const moment = require('moment');

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
        isActive:
          typeof candidate.isActive !== 'undefined'
            ? !!candidate.isActive
            : candidateAccess.isActive,
        isOnHomepage:
          typeof candidate.isOnHomepage !== 'undefined'
            ? !!candidate.isOnHomepage
            : candidateAccess.isOnHomepage,
      };

      const {
        contactFirstName,
        contactLastName,
        contactPhone,
        contactEmail,
        hubspotId,
      } = candidate;

      const data = {
        ...JSON.parse(candidateAccess.data),
        ...candidate,
        id,
      };
      if (!data.certifiedDate) {
        data.certifiedDate = moment(candidateAccess.createdAt).format(
          'MM/DD/YYYY',
        );
      }

      delete data.contactFirstName;
      delete data.contactLastName;
      delete data.contactPhone;
      delete data.contactEmail;
      delete data.hubspotId;

      let resolvedHubspotId = hubspotId;
      if (!hubspotId) {
        if (candidateAccess && candidateAccess.contact) {
          resolvedHubspotId = candidateAccess.contact.hubspotId;
        } else {
          resolvedHubspotId = '';
        }
      }

      await Candidate.updateOne({ id }).set({
        ...cleanCandidate,
        data: JSON.stringify(data),
        contact: {
          ...candidateAccess.contact,
          contactFirstName,
          contactLastName,
          contactPhone,
          contactEmail,
          hubspotId: resolvedHubspotId,
        },
      });

      const finalCandidate = await Candidate.findOne({ id });
      await sails.helpers.crm.updateCandidate(finalCandidate);

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.notFound();
    }
  },
};
