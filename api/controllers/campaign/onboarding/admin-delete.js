module.exports = {
  friendlyName: 'deleted Position',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

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
      const { slug } = inputs;

      await Campaign.destroy({ slug });

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at onboarding/admin-delete', e);
      return exits.badRequest({
        message: 'Error deleting campaign',
        e,
      });
    }
  },
};
