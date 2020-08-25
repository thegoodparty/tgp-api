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
  },

  fn: async function(inputs, exits) {
    try {
      const { id } = inputs;
      // first make sure the user doesn't have that ranking already.

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
