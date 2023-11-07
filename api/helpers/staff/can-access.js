module.exports = {
  inputs: {
    campaign: {
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
      const { campaign, user } = inputs;
      if (user.isAdmin) {
        return exits.success(true);
      }

      return exits.success(campaign.user === user.id);
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error at helpers/staff/can-access',
        e,
      );
      return exits.success(false);
    }
  },
};
