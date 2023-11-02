// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');
const slugify = require('slugify');
const moment = require('moment');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;
const appBase = sails.config.custom.appBase || sails.config.appBase;

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
    try {
      if (!hubSpotToken) {
        // for non production env.
        return exits.success('no api key');
      }
      const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });

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
