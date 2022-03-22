module.exports = {
  friendlyName: 'edit Position',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Updated',
    },

    badRequest: {
      description: 'Error updating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id, name } = inputs;
      await Position.updateOne({ id }).set({
        name,
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at Position/update', e);
      return exits.badRequest({
        message: 'Error updating Position',
        e,
      });
    }
  },
};
