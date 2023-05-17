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
      const existing = await Campaign.findOne({
        slug: campaign.slug,
      });

      // update can be done by an admin or a user.
      if (user.isAdmin) {
        await Campaign.updateOne({
          slug: campaign.slug,
        }).set({ data: campaign });
      } else {
        await Campaign.updateOne({
          slug: campaign.slug,
          user: user.id,
        }).set({ data: campaign });
        const updated = await Campaign.findOne({
          slug: campaign.slug,
          user: user.id,
        });
        if (updated) {
          await sails.helpers.crm.updateCampaign(updated);
        }
      }

      return exits.success({
        message: 'updated',
        // updated,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error updating campaign.' });
    }
  },
};
