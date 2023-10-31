module.exports = {
  inputs: {
    candidate: {
      type: 'ref',
      required: true,
    },
    user: {
      type: 'ref',
      required: true,
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { candidate, user } = inputs;
      if (user.isAdmin) {
        return exits.success(true);
      }

      const campaigns = await Campaign.find({
        user: user.id,
      });
      let campaign = false;
      if (campaigns && campaigns.length > 0) {
        campaign = campaigns[0].data;
      }

      const slug = campaign.candidateSlug;

      if (slug !== candidate.slug) {
        return exits.success(false);
      }

      // let candidateRecord = await Candidate.findOne({
      //   slug,
      //   isActive: true,
      // });

      // if (!candidateRecord) {
      //   return exits.success(false);
      // }

      return exits.success(true);
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error at helpers/staff/can-access',
        e,
      );
      return exits.success(false);
    }
  },
};
