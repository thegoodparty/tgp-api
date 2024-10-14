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
      const { data } = campaign;
      if (!data?.hubspotId) {
        return exits.success(false);
      }

      const hubspotId = data.hubspotId;

      const properties = [
        'past_candidate',
        'incumbent',
        'candidate_experience_level',
        'final_viability_rating',
        'primary_election_result',
        'election_results',
        'professional_experience',
        'p2p_campaigns',
        'p2p_sent',
        'confirmed_self_filer',
        'verified_candidates',
        'date_verified',
        'pro_candidate',
        'filing_deadline',
        'opponents',
        'hubspot_owner_id',
      ];

      const company = await hubspotClient.crm.companies.basicApi.getById(
        hubspotId,
        properties,
      );

      return exits.success(company);
    } catch (e) {
      console.log('hubspot error - update-campaign', e);
      await sails.helpers.slack.errorLoggerHelper(
        'hubspot error - update-campaign',
        e,
      );
      return exits.success(false);
    }
  },
};
