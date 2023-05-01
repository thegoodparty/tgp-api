// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

module.exports = {
  inputs: {
    formId: {
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
    if (!hubSpotToken) {
      // for non production env.
      return exits.success('no api key');
    }

    const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });

    const { formId } = inputs;
    try {
      const count = await hubspotClient.apiRequest({
        method: 'GET',
        path: `/form-integrations/v1/submissions/forms/${formId}`,
      });

      return exits.success(count);
    } catch (e) {
      console.log('hubspot error', e);
      return exits.success('not ok');
    }
  },
};
