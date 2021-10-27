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
  },
  async fn(inputs, exits) {
    try {
      const { candidateId, update } = inputs;
      const attr = {
        ...update,
        candidate: candidateId,
        status: 'pending',
      };
      await CampaignUpdate.create(attr);

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('Error creating campaign updates', e);
      return exits.badRequest({ message: 'Error creating campaign updates' });
    }
  },
};
