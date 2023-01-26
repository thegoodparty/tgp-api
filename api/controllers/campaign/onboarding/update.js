/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  friendlyName: 'Update Campaign',

  inputs: {
    campaign: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Updated',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { campaign } = inputs;
      const { user } = this.req;

      await Campaign.updateOne({
        slug: campaign.slug,
        user: user.id,
      }).set({ data: campaign });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updating campaign.' });
    }
  },
};
