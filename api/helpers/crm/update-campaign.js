const { hubspotClient } = require('../../utils/crm/crmClientSingleton');

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
      campaign = await Campaign.findOne({ id: campaign.id });
      const { data } = campaign || {};
      const companyObj = await sails.helpers.crm.getCrmCompanyObject(campaign);
      const name = companyObj.properties.name;

      const existingId = data.hubspotId;
      if (existingId) {
        try {
          await hubspotClient.crm.companies.basicApi.update(
            existingId,
            companyObj,
          );
        } catch (e) {
          console.log('error updating crm', e);

          if (e.code === 404) {
            // Could not find record in hubspot, remove the hubspot ID
            await Campaign.updateOne({ id: campaign.id }).set({
              data: { ...data, hubspotId: null },
            });
            await sails.helpers.slack.errorLoggerHelper(
              `Could not find hubspot company for ${name} with hubspotId ${existingId}`,
              e,
            );
          } else {
            await sails.helpers.slack.errorLoggerHelper(
              `Error updating company for ${name} with existing hubspotId: ${existingId} in hubspot`,
              e,
            );
          }
        }
        const userId = campaign.user;
        const user = await User.findOne({ id: userId });
        try {
          await sails.helpers.crm.updateUser(user);
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error updating user ${user.id} with existing hubspotId: ${existingId} in hubspot`,
            e,
          );
        }

        return exits.success(existingId);
      } else {
        // update user record with the id from the crm
        let createCompanyResponse;
        try {
          createCompanyResponse =
            await hubspotClient.crm.companies.basicApi.create({
              ...companyObj,
              properties: {
                ...companyObj.properties,
                lifecyclestage: 'opportunity',
              },
            });
        } catch (e) {
          console.log('error creating company', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error creating company for ${name} in hubspot`,
            e,
          );
        }

        if (!createCompanyResponse) {
          await sails.helpers.slack.errorLoggerHelper(
            `Error creating company for ${name} in hubspot. No response from hubspot.`,
            { companyObj, campaign },
          );
          return exits.success('not ok');
        }

        const userId = campaign.user;
        const user = await User.findOne({ id: userId });
        const hubspotId = createCompanyResponse.id;
        data.hubspotId = hubspotId;
        await Campaign.updateOne({ id: campaign.id }).set({
          data: { ...data, name },
        });
        // make sure we refresh campaign object so we have hubspotId.
        const campaignObj = await Campaign.findOne({ id: campaign.id });

        // associate the Contact with the Company in Hubspot
        try {
          await sails.helpers.crm.associateUserCampaign(
            user,
            campaignObj,
            false,
          );
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error associating user ${user.id}. hubspot id: ${hubspotId} to campaign ${campaign.id} in hubspot`,
            e,
          );
        }
        try {
          await sails.helpers.crm.updateUser(user);
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error updating user ${user.id}. in hubspot`,
            e,
          );
        }
        return exits.success(hubspotId);
      }
    } catch (e) {
      console.log('hubspot error - update-campaign', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Uncaught error in update-campaign',
        e,
      );
      return exits.success('not ok');
    }
  },
};
