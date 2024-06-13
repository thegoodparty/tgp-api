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

      const campaign = await Campaign.findOne({
        user: user.id,
      }).populate('pathToVictory');
      if (!campaign) {
        throw new Error('No campaign found for given user');
      }

      return exits.success(campaign);
    } catch (e) {
      console.log('error getting campaign', e);
      return exits.success(false);
    }
  },
};
