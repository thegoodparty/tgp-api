const { getCRMCompanyObject } = require('../../util/get-crm-company-object');
const hubspot = require('@hubspot/api-client');
const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

module.exports = {
  friendlyName: 'Mass CRM Companies Refresh',

  description: 'Admin-only endpoint for refreshing specific fields on all CRM companies.',

  inputs: {
    fields: {
      type: 'ref',
      description: 'Array of field names to update on Companies in the crm for each campaign object. Send `["all"]` w/o any other fields to update all fields.',
    },
  },

  exits: {
    success: {
      description: 'OK',
    },

    badRequest: {
      description: 'Error refreshing CRM companies',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const {fields} = inputs;
      const campaigns = await Campaign.find();
      const existingCRMCompanies = campaigns.filter(({data}) => data?.hubspotId);

      const companyUpdateObjects = await Promise.all(
        existingCRMCompanies.map(
          async campaign => {
            const id = campaign.data?.hubspotId;
            const companyObject = await getCRMCompanyObject(campaign);
            return fields.reduce(
              (aggregate, field) => {
                return {
                  ...aggregate,
                  properties: {
                    ...aggregate.properties,
                    ...(
                      companyObject.properties[field] || companyObject.properties[field] === null ?
                        {[field]: companyObject.properties[field]} : {}
                    )
                  }
                };
              }, {id, properties: {}}
            );
          }
        )
      );
    } catch (e) {
      console.error(e);
      return exits.badRequest({
        message: 'Error getting users',
      });
    }

    const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });


    let updates;
    try {
      updates = await hubspotClient.crm.companies.batchApi.update({
        inputs: companyUpdateObjects,
      });
    } catch (e) {
      console.log('error updating crm', e);
      await sails.helpers.slack.errorLoggerHelper(
          `Error updating companies in hubspot`,
          e,
      );
    }

    return exits.success(`OK: ${updates?.results?.length} companies updated`);

  },
};
