module.exports = {
  inputs: {
    campaignId: { type: 'number' },
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
    const { campaignId } = inputs;
    const campaign = await Campaign.findOne({ id: campaignId });
    if (!campaign) {
      return exits.notFound('Campaign not found');
    }
    const company = await sails.helpers.crm.getCompany(campaign);
    return exits.success({
      company,
    });
  },
};
