module.exports = {
  inputs: {},
  exits: {
    success: {
      description: 'Successfully retrieved portal session',
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

    if (!portalSession) {
      return exits.badRequest('Could not retrieve portal session');
    }
    return exits.success({
      redirectUrl: portalSession.url,
    });
  },
};
