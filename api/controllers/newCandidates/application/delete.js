module.exports = {
  friendlyName: 'delete candidate application',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Deleted',
    },

    badRequest: {
      description: 'Error deleting',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id } = inputs;
      const user = this.req.user;
      await Application.destroyOne({
        id,
        user: user.id,
      });

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at applications/delete', e);
      return exits.badRequest({
        message: 'Error deleting applications',
        e,
      });
    }
  },
};
