const { hubspotClient } = require('../../utils/crm/crmClientSingleton');

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
    if (!hubspotClient) {
      return exits.success('No hubspot client');
    }
    try {
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
        user = await User.findOne({ id: user.id });
        if (user.metaData) {
          const metaData = JSON.parse(user.metaData);
          if (metaData.hubspotId) {
            contactId = metaData.hubspotId;
          }
        }
      }

      if (!contactId) {
        // this should not happen since the contact id should have created
        await sails.helpers.slack.errorLoggerHelper(
          'user does not have a contact id',
          user.email,
        );
        return exits.success('not ok');
      }

      let companyId = campaign.data ? campaign.data.hubspotId : false;
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
              associationTypeId:
                hubspotClient.AssociationTypes.companyToContact,
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
              associationTypeId:
                hubspotClient.AssociationTypes.primaryCompanyToContact, //companyToContact
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
