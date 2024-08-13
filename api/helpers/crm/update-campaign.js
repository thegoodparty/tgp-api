// https://developers.hubspot.com/docs/api/crm/companies
// private app logs: https://app.hubspot.com/private-apps/21589597/1641594/logs/api?id=9666b9d1-23c5-4ae4-8ca0-f9f91300a5a6
const hubspot = require('@hubspot/api-client');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

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
    try {
      if (!hubSpotToken) {
        // for non production env.
        return exits.success('no api key');
      }

      const appBase = sails.config.custom.appBase || sails.config.appBase;
      if (appBase === 'http://localhost:4000') {
        console.log('crm helpers disabled on localhost');
        return exits.success('crm helpers disabled on localhost');
      }

      const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });
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
          await sails.helpers.slack.errorLoggerHelper(
            `Error updating company for ${name} with existing hubspotId: ${existingId} in hubspot`,
            e,
          );
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
            await hubspotClient.crm.companies.basicApi.create(companyObj);
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
