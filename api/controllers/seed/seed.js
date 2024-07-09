// connect campaigns and candidates
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const campaigns = await Campaign.find({
        id: { '>': 7000 },
      });

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        try {
          await sails.helpers.crm.updateCampaign(campaign);
        } catch (e) {
          console.log('Error in seed campaign', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error at seed with campaign ${campaign.slug}`,
            e,
          );
        }
      }
      await sails.helpers.slack.errorLoggerHelper(`Done updating hubspot`, {
        total: campaigns.length,
      });
      return exits.success({
        message: 'matched campaign with candidates.',
        total: campaigns.length,
      });
    } catch (e) {
      console.log('Error in seed', e);
      await sails.helpers.slack.errorLoggerHelper('Error at seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};
