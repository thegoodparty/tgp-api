const { hubspotClient } = require('../../utils/crm/crmClientSingleton');

const generateCompanyProperties =
  (fields = []) =>
  async (campaign) => {
    const id = campaign.data?.hubspotId;
    const companyObject = await sails.helpers.crm.getCrmCompanyObject(campaign);
    const includeAll = fields.length === 1 && fields.includes('all');
    const properties = includeAll
      ? companyObject
      : fields.reduce(
          (aggregate, field) => ({
            ...aggregate,
            ...(companyObject.properties[field] ||
            companyObject.properties[field] === null
              ? { [field]: companyObject.properties[field] }
              : {}),
          }),
          {},
        );
    return { id, properties };
  };

module.exports = {
  friendlyName: 'Mass CRM Companies Refresh',

  description:
    'Admin-only endpoint for refreshing specific fields on all CRM companies.',

  inputs: {
    fields: {
      type: 'ref',
      description:
        'Array of field names to update on Companies in the crm for each campaign object. Send `["all"]` w/o any other fields to update all fields.',
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

  fn: async function (inputs, exits) {
    let companyUpdateObjects = [];
    try {
      const { fields } = inputs;
      const campaigns = await Campaign.find();
      const existingCRMCompanies = campaigns.filter(
        ({ data }) => data?.hubspotId,
      );

      companyUpdateObjects = await Promise.all(
        existingCRMCompanies.map(generateCompanyProperties(fields)),
      );
    } catch (e) {
      console.error(e);
      return exits.badRequest({
        message: 'Error getting users',
      });
    }

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

    console.log(`CRM Companies updated =>`, updates);

    return exits.success(`OK: ${updates?.results?.length} companies updated`);
  },
};
