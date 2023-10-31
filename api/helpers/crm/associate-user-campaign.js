// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

module.exports = {
  inputs: {
    user: {
      type: 'json',
      required: true,
    },
    campaign: {
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
  fn: async function (inputs, exits) {
    try {
      if (!hubSpotToken) {
        // for non production env.
        return exits.success('no api key');
      }

      const appBase = sails.config.custom.appBase || sails.config.appBase;
      if (appBase === 'http://localhost:4000') {
        return exits.success('crm helpers disabled on localhost');
      }

      const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });

      let { user, campaign, remove } = inputs;
      let contactId;
      if (user.metaData) {
        const metaData = JSON.parse(user.metaData);
        if (metaData.hubspotId) {
          contactId = metaData.hubspotId;
        }
      }

      if (!contactId) {
        // it would be smart if this returned an id instead of a success message.
        await sails.helpers.crm.updateUser(user);
        // make sure we pull the latest user object with the hubspotId.
        // console.log('refreshing user', user.id);
        user = await User.findOne({ id: user.id });
        if (user.metaData) {
          const metaData = JSON.parse(user.metaData);
          if (metaData.hubspotId) {
            contactId = metaData.hubspotId;
          }
        }
      }
      //   console.log('contactId', contactId);

      let companyId = campaign.data ? campaign.data.hubspotId : false;
      //   console.log('companyId', companyId);
      if (!companyId) {
        // this should not happen since its only called by update-campaign.
        await sails.helpers.slack.errorLoggerHelper(
          'campaign has no hubspotid in associateUserCampaign',
          campaign,
        );
        return exits.success('not ok');
      }

      if (remove) {
        await hubspotClient.crm.companies.associationsApi.archive(
          companyId,
          'contacts',
          contactId,
          [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: hubspot.AssociationTypes.companyToContact,
              // AssociationTypes contains the most popular HubSpot defined association types
            },
          ],
        );
      } else {
        await hubspotClient.crm.companies.associationsApi.create(
          companyId,
          'contacts',
          contactId,
          [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: hubspot.AssociationTypes.companyToContact,
              // AssociationTypes contains the most popular HubSpot defined association types
            },
          ],
        );
      }

      return exits.success('ok');
    } catch (e) {
      console.log('hubspot error - associate user-campaign', e);
      await sails.helpers.slack.errorLoggerHelper(
        'error in associateUserCampaign',
        e,
      );
      return exits.success('not ok');
    }
  },
};
