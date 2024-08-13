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

      const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });
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
      ];

      const company = await hubspotClient.crm.companies.basicApi.getById(
        hubspotId,
        properties,
      );
      return exits.success(company);
    } catch (e) {
      console.log('hubspot error - update-campaign', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Uncaught error in update-campaign',
        e,
      );
      return exits.success(false);
    }
  },
};
