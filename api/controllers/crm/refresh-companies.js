module.exports = {
  inputs: {
    campaignId: { type: 'number' },
  },

  exits: {
    success: {
      description: 'found',
    },

    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },

    notFound: {
      description: 'Not Found',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      let updated = 0;
      let failures = [];

      let campaigns;

      if (inputs.campaignId) {
        const campaign = await Campaign.findOne({ id: inputs.campaignId });
        campaigns = [campaign];
      } else {
        campaigns = (await Campaign.find()).filter((c) => c.data?.hubspotId);
      }

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        try {
          await sails.helpers.crm.updateCampaign(campaign);
          updated++;
        } catch (e) {
          failures.push(campaign.id);
          console.log('error updating campaign', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error updating campaign ${campaign.id} in hubspot`,
            e,
          );
        }
      }

      return exits.success({
        message: 'ok',
        updated,
        failures,
      });
    } catch (e) {
      console.log('error at crm/sync', e);
      return exits.badRequest();
    }
  },
};
