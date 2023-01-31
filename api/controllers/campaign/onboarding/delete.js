module.exports = {
  friendlyName: 'deleted Position',

  inputs: {},

  exits: {
    success: {
      description: 'Deleted',
    },

    badRequest: {
      description: 'Error updating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { user } = this.req;

      await Campaign.destroy({ user: user.id });

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at onboarding/delete', e);
      return exits.badRequest({
        message: 'Error deleting campaign',
        e,
      });
    }
  },
};
