module.exports = {
  friendlyName: 'deleted Position',

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
      description: 'Error updating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id } = inputs;
      await Position.destroyOne({ id });

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at Position/delete', e);
      return exits.badRequest({
        message: 'Error deleting issue topic',
        e,
      });
    }
  },
};
