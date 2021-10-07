/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Delete Update',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Deleted',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error deleting.',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { id } = inputs;
      await CampaignUpdate.destroyOne({ id });
      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('Error in delete candidate', e);
      return exits.badRequest();
    }
  },
};
