/**
 * user/register.js
 *
 * @description :: Stand Alone action2 for signing up a user.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

module.exports = {
  inputs: {
    type: {
      type: 'string',
      isIn: ['doorKnocking', 'calls', 'digital'],
      required: true,
    },
    quantity: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Campaign Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      const { type, quantity } = inputs;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0];
      }

      if (!campaign) {
        return exits.badRequest({
          message: 'Error creating CampaignUpdateHistory',
        });
      }

      console.log('creating', {
        type,
        quantity,
        campaign: campaign.id,
        user: user.id,
      });

      await CampaignUpdateHistory.create({
        type,
        quantity,
        campaign: campaign.id,
        user: user.id,
      });

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error creating CampaignUpdateHistory.',
      });
    }
  },
};
