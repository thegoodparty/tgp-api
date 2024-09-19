module.exports = {
  inputs: {},

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
      let updated = 0;
      const campaigns = await Campaign.find();
      for (let i = 0; i < campaigns.length; i++) {
        try {
          const campaign = campaigns[i];
          if (campaign.data?.hubSpotUpdates) {
            continue;
          }
          const company = await sails.helpers.crm.getCompany(campaign);
          if (!company) {
            continue;
          }
          sleep(400);

          const { properties } = company;
          const {
            past_candidate,
            incumbent,
            candidate_experience_level,
            final_viability_rating,
            primary_election_result,
            election_results,
            professional_experience,
            p2p_campaigns,
            p2p_sent,
            confirmed_self_filer,
            verified_candidates,
            date_verified,
            pro_candidate,
            filing_deadline,
            opponents,
          } = properties || {};

          campaign.data.hubSpotUpdates = {
            past_candidate,
            incumbent,
            candidate_experience_level,
            final_viability_rating,
            primary_election_result,
            election_results,
            professional_experience,
            p2p_campaigns,
            p2p_sent,
            confirmed_self_filer,
            verified_candidates,
            date_verified,
            pro_candidate,
            filing_deadline,
            opponents,
          };
          const updatedCampaign = {
            data: campaign.data,
          };
          if (verified_candidates === 'Yes' && !campaign.isVerified) {
            updatedCampaign.isVerified = true;
          }

          if (pro_candidate === 'Yes' && !campaign.isPro) {
            updatedCampaign.isPro = true;
          }
          if (election_results === 'Won General' && !campaign.didWin) {
            updatedCampaign.didWin = true;
          }

          await Campaign.updateOne({ id: campaign.id }).set(updatedCampaign);
          updated++;
        } catch (e) {
          console.log('error at crm/sync', e);
          await sails.helpers.slack.errorLoggerHelper('error at crm/sync', {
            error,
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
