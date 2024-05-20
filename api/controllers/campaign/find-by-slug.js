/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Campaigns.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  friendlyName: 'Admin find Campaign by slug',

  inputs: {
    slug: {
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { slug } = inputs;
      const campaign = await Campaign.findOne({
        slug,
      }).populate('pathToVictory');

      if (campaign?.pathToVictory) {
        campaign.pathToVictory = campaign.pathToVictory.data || {};
        campaign.pathToVictory.id = campaign.pathToVictory.id || -1;
      }

      return exits.success({
        campaign,
      });
    } catch (e) {
      console.log('Error in find find-by-slug', e);
      return exits.forbidden();
    }
  },
};
