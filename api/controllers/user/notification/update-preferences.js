module.exports = {
  inputs: {
    metaData: {
      required: true,
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'User successfully updated.',
    },

    badRequest: {
      description: 'Error updating user',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      const { metaData } = inputs;

      const updated = await User.updateOne({ id: user.id }).set({ metaData });

      return exits.success({
        user: updated,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper(
        'Error updating user notification preferences',
        e,
      );
      return exits.badRequest({
        message: 'Error updating user',
      });
    }
  },
};
