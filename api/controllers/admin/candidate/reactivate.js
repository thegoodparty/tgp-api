module.exports = {
  friendlyName: 'All Candidates',

  description: 'admin call for getting all candidates',

  inputs: {
    id: {
      type: 'number',
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
      const { id } = inputs;
      const candidate = await Candidate.findOne({ id, isActive: false });
      if (!candidate) {
        return exits.badRequest({
          message: 'No candidate',
        });
      }

      const data = JSON.parse(candidate.data);

      await Candidate.updateOne({ id, isActive: false }).set({
        isActive: true,
      });

      const campaign = await Campaign.findOne({
        slug: data.campaignOnboardingSlug,
      });

      await Campaign.updateOne({ slug: data.campaignOnboardingSlug }).set({
        isActive: true,
        data: {
          ...campaign.data,
          launchStatus: 'launched',
        },
      });

      return exits.success({
        message: 'restored candidate',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at admin/candidate/reactivate',
        e,
      );
      return exits.badRequest({
        message: 'Error admin/candidate/reactivate',
      });
    }
  },
};
