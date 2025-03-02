const {
  handleCancelCampaign,
} = require('../../../utils/campaign/event-handlers/handleCancelCampaign');

module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'success',
    },

    badRequest: {
      description: 'Error hiding candidate',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { slug } = inputs;
      const campaign = await Campaign.findOne({ slug }).populate('user');
      if (!campaign || !campaign.data?.candidateSlug) {
        return exits.badRequest({
          message: 'No campaign',
        });
      }

      await handleCancelCampaign(campaign);

      const candidate = await Candidate.findOne({
        slug: campaign.data.candidateSlug,
      });

      if (!candidate) {
        return exits.badRequest({
          message: 'No candidate',
        });
      }

      await Candidate.updateOne({ slug: campaign.data.candidateSlug }).set({
        isActive: false,
      });

      await Campaign.updateOne({ slug }).set({
        isActive: false,
        data: {
          ...campaign.data,
          launchStatus: false,
        },
      });

      return exits.success({
        message: `updated candidate with slug ${campaign.data.candidateSlug}`,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at admin/deactivate-candidate-by-campaign',
        e,
      );
      return exits.badRequest({
        message: 'Error deactivate-candidate-by-campaign',
      });
    }
  },
};
