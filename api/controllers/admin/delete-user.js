module.exports = {
  friendlyName: 'Delete User',

  description: 'delete user',

  inputs: {
    id: {
      description: 'User ID',
      example: 1,
      required: true,
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'User Deleted',
    },

    badRequest: {
      description: 'Error Deleting User',
      responseType: 'badRequest',
    },
    forbidden: {
      description: 'This action is allowed only on dev.',
      responseType: 'forbidden',
    },
  },

  fn: async function(inputs, exits) {
    try {
      if (!sails.config.custom.appBase.includes('dev.thegoodparty.org')) {
        return exits.forbidden({
          message: 'This action is allowed only on dev.',
        });
      }
      const { id } = inputs;
      const user = await User.findOne({
        id,
      });
      if (!user) {
        return exits.badRequest({
          message: 'User not found',
        });
      }
      await User.destroyOne({ id });
      return exits.success({
        message: 'deleted successfully',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at admin/delete-user', e);
      return exits.badRequest({
        message: 'Error Deleting User',
      });
    }
  },
};
