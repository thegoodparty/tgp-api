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
      const campaign = await Campaign.findOne({ slug });
      if (!campaign || !campaign.data?.candidateSlug) {
        return exits.badRequest({
          message: 'No campaign',
        });
      }

      const candidate = await Candidate.findOne({
        slug: campaign.data.candidateSlug,
      });

      if (!candidate) {
        return exits.badRequest({
          message: 'No candidate',
        });
      }

      await Candidate.updateOne({ slug }).set({
        isActive: false,
      });

      return exits.success({
        message: `updated candidate with slug ${campaign.data.candidateSlug}`,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error at admin/deactivate-candidate-by-campaign',
        e,
      );
      return exits.badRequest({
        message: 'Error deactivate-candidate-by-campaign',
      });
    }
  },
};
