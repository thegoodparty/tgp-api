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
      let campaigns = await Campaign.find({ user: userId })
        .populate('pathToVictory')
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        const campaignVolunteer = await CampaignVolunteer.find({
          user: userId,
        }).limit(1);
        if (
          campaignVolunteer &&
          campaignVolunteer.length > 0 &&
          campaignVolunteer[0]?.role === 'manager'
        ) {
          return exits.success(
            await Campaign.findOne({
              id: campaignVolunteer[0]?.campaign,
            }).populate('pathToVictory'),
          );
        }
      }

      if (!campaigns || campaigns.length === 0) {
        throw new Error('No campaigns found for given user');
      }

      return exits.success(campaigns[0]);
    } catch (e) {
      return exits.success(false);
    }
  },
};
