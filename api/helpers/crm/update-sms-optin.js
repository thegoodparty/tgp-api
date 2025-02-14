const { hubspotClient } = require('../../utils/crm/crmClientSingleton');

module.exports = {
  inputs: {
    hubspotId: {
      type: 'string',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    if (!hubspotClient) {
      return exits.success('No hubspot client');
    }
    try {
      const { hubspotId } = inputs;
      const userObj = {
        properties: {
          sms_opt_in_out: 'false',
        },
      };
      if (hubspotId) {
        const resp = await hubspotClient.crm.contacts.basicApi.update(
          hubspotId,
          userObj,
        );
        if (resp?.id !== hubspotId) {
          await sails.helpers.slack.errorLoggerHelper(
            'Error updating hubspot- update-sms-optin',
            resp,
          );
          return exits.success('not ok');
        }

        return exits.success('ok');
      } else {
        await sails.helpers.slack.errorLoggerHelper(
          'Error updating hubspot- update-sms-optin',
          resp,
        );
        return exits.success('user has no hubspot record');
      }
    } catch (e) {
      console.log('hubspot error - update sms optin', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error updating hubspot- update-candidate',
        e,
      );
      return exits.success('not ok');
    }
  },
};
