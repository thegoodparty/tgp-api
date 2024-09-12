/* eslint-disable object-shorthand */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    userId: {
      type: 'number',
    },
  },

  exits: {
    success: {
      outputDescription: 'Campaign Found',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { userId } = inputs;
      let campaign;
      try {
        campaign = await Campaign.findOne({ user: userId }).populate(
          'pathToVictory',
        );
        return exits.success(campaign);
      } catch (e) {
        const campaigns = await Campaign.find({
          user: userId,
        }).populate('pathToVictory');

        if (!campaigns) {
          throw new Error('No campaigns found for given user');
        }

        campaign = campaigns && campaigns.length > 0 ? campaigns[0] : false;

        return exits.success(campaign);
      }
    } catch (e) {
      console.log('error getting campaign', e);
      return exits.success(false);
    }
  },
};
