module.exports = {
  inputs: {},

  exits: {
    success: {
      statusCode: 201,
      description:
        'Successfully created payment portal redirect url and set isPro accordingly',
    },

    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (_, exits) {
    const user = await User.findOne({ id: this.req.user.id });
    const { customerId } = JSON.parse(user.metaData);
    if (!customerId) {
      throw new Error('No customerId found on user');
    }

    const portalSession = await sails.helpers.payments.createPortalSession(
      customerId,
    );

    return exits.success({
      redirectUrl: portalSession?.url,
    });
  },
};
