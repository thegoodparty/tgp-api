// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');
const slugify = require('slugify');
const moment = require('moment');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;
const appBase = sails.config.custom.appBase || sails.config.appBase;

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

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    if (!hubSpotToken) {
      // for non production env.
      console.log('Error: no hubSpotToken!');
      return exits.success('no api key');
    }
    const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });

    const { campaign } = inputs;
    // console.log('campaign', campaign);

    const { data } = campaign;
    const dataDetails = campaign?.data?.details;
    // console.log('dataDetails', dataDetails);
    try {
      const { zip, firstName, lastName, party, office, state, pledged, goals } =
        dataDetails;
      const companyObj = {
        properties: {
          name: `${firstName} ${lastName}`,
          candidate_name: `${firstName} ${lastName}`,
          candidate_party: party,
          candidate_office: office,
          candidate_state: state,
          lifecyclestage: 'customer',
          type: 'CANDIDATE',
          zip,
          pledge_status: pledged ? 'yes' : 'no',
          // todo: this will need to be reworked if/when we add in Rob/Colton
          unlock_expert:
            data?.goals?.runningAgainst && data.goals.runningAgainst.length > 0
              ? 'Jared'
              : '',
        },
      };

      const existingId = data.hubspotId;
      if (existingId) {
        await hubspotClient.crm.companies.basicApi.update(
          existingId,
          companyObj,
        );
        // console.log('apiResp', apiResp);
        return exits.success(existingId);
      } else {
        // update user record with the id from the crm
        const createCompanyResponse =
          await hubspotClient.crm.companies.basicApi.create(companyObj);

        const hubspotId = createCompanyResponse.id;
        data.hubspotId = hubspotId;
        await Campaign.updateOne({ id: campaign.id }).set({
          data,
        });
        // console.log('apiResp', apiResp);
        return exits.success(hubspotId);
      }
    } catch (e) {
      console.log('hubspot error', e);
      await sails.helpers.errorLoggerHelper('Error updating hubspot', e);
      return exits.success('not ok');
    }
  },
};