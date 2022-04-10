// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');

const hubSpotKey = sails.config.custom.hubSpotKey || sails.config.hubSpotKey;

module.exports = {
  inputs: {
    user: {
      type: 'json',
      required: true,
    },
    fields: {
      type: 'json',
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
  fn: async function(inputs, exits) {
    if (!hubSpotKey) {
      // for non production env.
      return exits.success('no api key');
    }

    const hubspotClient = new hubspot.Client({ apiKey: hubSpotKey });

    const { user, fields } = inputs;
    try {
      let contactId;
      if (user.metaData) {
        const metaData = JSON.parse(user.metaData);
        if (metaData.hubspotId) {
          contactId = metaData.hubspotId;
        }
      }

      if (!contactId) {
        await sails.helpers.crm.create(user);
      }

      const contactObj = {
        properties: fields,
      };

      // update user record with the id from the crm
      console.log('creating contact...');
      const createContactResponse = await hubspotClient.crm.contacts.basicApi.update(
        contactId,
        contactObj,
      );
      console.log('updated', createContactResponse);

      return exits.success('ok');
    } catch (e) {
      console.log('hubspot error', e);
      return exits.success('not ok');
    }
  },
};
