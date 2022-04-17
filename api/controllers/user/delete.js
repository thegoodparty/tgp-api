module.exports = {
  friendlyName: 'Delete User',

  description: 'delete user',

  inputs: {},

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
      const { user } = this.req;

      await Support.destroy({ user: user.id });
      await ShareCandidate.destroy({ user: user.id });
      await Application.destroy({ user: user.id });
      await User.destroyOne({ id: user.id });
      return exits.success({
        message: 'deleted successfully',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error user/delete', e);
      return exits.badRequest({
        message: 'Error Deleting User',
      });
    }
  },
};
