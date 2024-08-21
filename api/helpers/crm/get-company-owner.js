const { hubspotClient } = require('../../utils/crm/crmClientSingleton');

module.exports = {
  inputs: {
    companyOwnerId: {
      type: 'string',
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
      const { companyOwnerId } = inputs;

      const owner = await hubspotClient.crm.owners.ownersApi.getById(
        companyOwnerId,
      );

      return exits.success(owner);
    } catch (e) {
      console.log('hubspot error - get-company-owner', e);
      await sails.helpers.slack.errorLoggerHelper(
        'hubspot error - get-company-owner',
        e,
      );
      return exits.success(false);
    }
  },
};
