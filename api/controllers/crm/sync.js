const { pick } = require('../../utils/objects');
const { hubspotProperties } = require('../../utils/crm/crmClientSingleton');

module.exports = {
  inputs: {
    campaignId: {
      type: 'number',
      description: 'Campaign ID to sync one campaign',
    },
    resync: {
      type: 'boolean',
      description: 'Pass true to resync and overwrite current hubSpotUpdates',
    },
  },

  exits: {
    success: {
      description: 'found',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
    notFound: {
      description: 'Not Found',
      responseType: 'notFound',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { campaignId, resync = false } = inputs;

      let updated = 0;

      const campaigns = campaignId
        ? [await Campaign.findOne({ id: campaignId })]
        : await Campaign.find();

      for (let i = 0; i < campaigns.length; i++) {
        try {
          const campaign = campaigns[i];
          if (campaign.data?.hubSpotUpdates && resync !== true) {
            console.log(`Skipping resync - ${campaign.id}`);
            continue;
          }
          const company = await sails.helpers.crm.getCompany(campaign);
          if (!company) {
            console.log(`No company found - ${campaign.id}`);
            continue;
          }
          sleep(400);

          console.log(`Syncing - ${campaign.id}`);

          /* eslint-disable camelcase */
          const { verified_candidates, pro_candidate, election_results } =
            company.properties;

          campaign.data.hubSpotUpdates = pick(
            company.properties,
            hubspotProperties,
          );

          const updatedCampaign = {
            data: campaign.data,
          };

          if (
            String(verified_candidates).toLowerCase() === 'yes' &&
            !campaign.isVerified
          ) {
            updatedCampaign.isVerified = true;
          }

          if (
            String(pro_candidate).toLowerCase() === 'yes' &&
            !campaign.isPro
          ) {
            updatedCampaign.isPro = true;
          }

          if (
            String(election_results).toLowerCase() === 'won general' &&
            !campaign.didWin
          ) {
            updatedCampaign.didWin = true;
          }
          /* eslint-enable camelcase */

          await Campaign.updateOne({ id: campaign.id }).set(updatedCampaign);
          updated++;
        } catch (e) {
          console.log('error at crm/sync', e);
          await sails.helpers.slack.errorLoggerHelper('error at crm/sync', {
            error: e,
            campaign: campaigns[i].slug,
          });
        }
      }
      await sails.helpers.slack.errorLoggerHelper('completed crm/sync', {
        updated,
      });
      return exits.success({
        message: 'ok',
        updated,
      });
    } catch (e) {
      console.log('error at crm/sync', e);
      return exits.badRequest();
    }
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
