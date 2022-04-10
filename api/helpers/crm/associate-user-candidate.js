// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');

const hubSpotKey = sails.config.custom.hubSpotKey || sails.config.hubSpotKey;

module.exports = {
  inputs: {
    user: {
      type: 'json',
      required: true,
    },
    candidate: {
      type: 'json',
      required: true,
    },
    remove: {
      type: 'boolean',
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

    const { user, candidate, remove } = inputs;
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

      let companyId = candidate.contact ? candidate.contact.hubspotId : false;
      if (!companyId) {
        companyId = await sails.helpers.crm.createCandidate(candidate);
      }

      console.log('associating ', contactId, ' with ', companyId);
      if (remove) {
        await hubspotClient.crm.companies.associationsApi.archive(
          companyId,
          'contacts',
          contactId,
          'company_to_contact',
        );
        console.log('remove association');
      } else {
        await hubspotClient.crm.companies.associationsApi.create(
          companyId,
          'contacts',
          contactId,
          'company_to_contact',
        );

        console.log('associated');
      }

      return exits.success('ok');
    } catch (e) {
      console.log('hubspot error', e);
      return exits.success('not ok');
    }
  },
};
