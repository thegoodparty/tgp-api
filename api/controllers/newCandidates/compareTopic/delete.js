module.exports = {
  friendlyName: 'deleyed compareTopic',

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
      await CompareTopic.destroyOne({ id });

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at compareTopic/delete', e);
      return exits.badRequest({
        message: 'Error deleting topic',
        e,
      });
    }
  },
};
