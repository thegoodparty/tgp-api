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
      });
      const data = campaign.data;
      data.id = campaign.id;

      return exits.success({
        campaign: data,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.forbidden();
    }
  },
};
