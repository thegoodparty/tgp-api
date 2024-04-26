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
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0];
      }

      return exits.success(campaign);
    } catch (e) {
      console.log('error getting campaign', e);
      return exits.success(false);
    }
  },
};
