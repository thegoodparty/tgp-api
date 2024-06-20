/* eslint-disable object-shorthand */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    user: {
      type: 'json',
    },
  },

  exits: {
    success: {
      outputDescription: 'Campaign Found',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = inputs;

      const campaigns = await Campaign.find({
        user: user.id,
      }).populate('pathToVictory');

      if (!campaigns) {
        throw new Error('No campaigns found for given user');
      }

      const campaign = campaigns && campaigns.length > 0 ? campaigns[0] : false;

      return exits.success(campaign);
    } catch (e) {
      console.log('error getting campaign', e);
      return exits.success(false);
    }
  },
};
