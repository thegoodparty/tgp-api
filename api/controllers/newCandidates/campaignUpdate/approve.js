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
    id: {
      type: 'number',
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
      const { id } = inputs;
      await CampaignUpdate.updateOne({ id }).set({
        status: 'accepted',
      });
      return exits.success({
        message: 'accepted',
      });
    } catch (e) {
      console.log('Error updating campaign updates', e);
      return exits.badRequest({ message: 'Error updating campaign updates' });
    }
  },
};
