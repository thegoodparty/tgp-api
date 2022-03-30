/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Update Candidate',

  description: 'Portal endpoint to create a campaign update request.',

  inputs: {
    candidateId: {
      type: 'number',
      required: true,
    },
    update: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error creating',
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

      const { candidateId, update } = inputs;
      const candidate = await Candidate.findOne({ id: candidateId });
      const canAccess = await sails.helpers.staff.canAccess(candidate, user);
      if (!canAccess) {
        return exits.forbidden();
      }
      const attr = {
        ...update,
        candidate: candidateId,
      };
      const newUpdate = await CampaignUpdate.create(attr).fetch();

      return exits.success({
        updateId: newUpdate.id,
      });
    } catch (e) {
      console.log('Error creating campaign updates', e);
      return exits.badRequest({ message: 'Error creating campaign updates' });
    }
  },
};
