/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Campaigns.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const camelToSentence = (text) => {
  const result = text.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

module.exports = {
  friendlyName: 'Find Campaign associated with user',

  inputs: {},

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
      const user = this.req.user;

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      let campaignId = 0;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
        campaignId = campaigns[0].id;
      }

      // fix any old style aiContent.
      let updated = false;
      if (campaign.aiContent) {
        for (const key in campaign.aiContent) {
          if (campaign.aiContent.hasOwnProperty(key)) {
            if (typeof campaign.aiContent[key] === 'string') {
              updated = true;
              campaign.aiContent[key] = {
                name: camelToSentence(key),
                content: campaign.aiContent[key],
                updatedAt: new Date().valueOf(),
              };
            }
          }
        }
      }
      if (updated === true) {
        await Campaign.updateOne({
          id: campaignId,
        }).set({ data: campaign });
      }

      return exits.success({
        campaign,
      });
    } catch (e) {
      console.log('Error in find candidate', e);
      return exits.forbidden();
    }
  },
};
