const moment = require('moment');

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const campaigns = await Campaign.find({ isActive: true });

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const { data } = campaign;
        if (!data) {
          continue;
        }
        const { details } = data;
        if (!details) {
          continue;
        }
        const { primaryElectionDate } = details;
        if (!primaryElectionDate) {
          continue;
        }
        await sails.helpers.crm.updateCampaign(campaign);
      }

      return exits.success('Done');
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};
