module.exports = {
  inputs: {},

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
      const campaigns = await Campaign.find();
      for (let i = 0; i < campaigns.length; i++) {
        try {
          const campaign = campaigns[i];
          if (campaign.data?.hubSpotUpdates) {
            continue;
          }
          await sails.helpers.fullstory.customAttr(campaign.user);
          await sleep(100);
          updated++;
        } catch (e) {
          console.log('error at crm/sync', e);
          await sails.helpers.slack.errorLoggerHelper('error at crm/sync', {
            error,
            campaign: campaigns[i].slug,
          });
        }
      }
      await sails.helpers.slack.errorLoggerHelper('completed crm/sync', {
        updated,
      });
      return exits.success({
        message: 'ok',
        updated,
      });
    } catch (e) {
      console.log('error at crm/sync', e);
      return exits.badRequest();
    }
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
