module.exports = {
  inputs: {
    meta: {
      type: 'json',
      required: true,
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
      const user = this.req.user;
      const { meta } = inputs;
      const existingMeta = user.metaData ? JSON.parse(user.metaData) : {};

      const updatedMeta = {
        ...existingMeta,
        ...meta,
      };

      await User.updateOne({ id: user.id }).set({
        metaData: JSON.stringify(updatedMeta),
      });

      await sails.helpers.crm.updateUser(user);

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error updating user', e);
      return exits.badRequest({
        message: 'Error updating user',
      });
    }
  },
};
