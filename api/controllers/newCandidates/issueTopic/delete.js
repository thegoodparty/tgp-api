
module.exports = {
  friendlyName: 'deleted issueTopic',

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
      await IssueTopic.destroyOne({ id });

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at issueTopic/delete', e);
      return exits.badRequest({
        message: 'Error deleting issue topic',
        e,
      });
    }
  },
};
