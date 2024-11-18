const {
  hubspotClient,
  hubspotProperties,
} = require('../../utils/crm/crmClientSingleton');
module.exports = {
  inputs: {
    campaign: {
      type: 'json',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
  },
  fn: async function (inputs, exits) {
    if (!hubspotClient) {
      return exits.success('No hubspot client');
    }
    try {
      let { campaign } = inputs;
      const { data } = campaign;
      if (!data?.hubspotId) {
        return exits.success(false);
      }

      const hubspotId = data.hubspotId;

      const company = await hubspotClient.crm.companies.basicApi.getById(
        hubspotId,
        hubspotProperties,
      );

      return exits.success(company);
    } catch (e) {
      console.log('hubspot error - update-campaign', e);
      await sails.helpers.slack.errorLoggerHelper(
        'hubspot error - update-campaign',
        e,
      );
      return exits.success(false);
    }
  },
};
