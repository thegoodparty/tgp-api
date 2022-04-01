/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'edit Candidate update',

  description: 'Portal endpoint to edit update',

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
      description: 'Updated',
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
      };
      await CampaignUpdate.updateOne({
        id: update.id,
        candidate: candidateId,
      }).set(attr);

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('Error creating campaign updates', e);
      return exits.badRequest({ message: 'Error creating campaign updates' });
    }
  },
};
