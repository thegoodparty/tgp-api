const moment = require('moment');
module.exports = {
  friendlyName: 'Phone Verification helper',

  description: 'Phone verification helper using twilio API',

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

      let slug;
      if (user.isAdmin) {
        slug = candidate.slug;
      } else {
        const campaigns = await Campaign.find({
          user: user.id,
        });
        let campaign = false;
        if (campaigns && campaigns.length > 0) {
          campaign = campaigns[0].data;
        }

        slug = campaign.candidateSlug;

        if (slug !== candidate.slug) {
          return exits.success(true);
        }
      }

      let candidateRecord = await Candidate.findOne({
        slug,
        isActive: true,
      });

      if (!candidateRecord) {
        return exits.success(true);
      }

      return exits.success(false);
    } catch (e) {
      return exits.success(false);
    }
  },
};
