module.exports = {
  friendlyName: 'edit compareTopic',

  inputs: {
    topic: {
      type: 'json',
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
      const { topic } = inputs;
      await CompareTopic.updateOne({ id: topic.id }).set({
        name: topic.name,
        description: topic.description,
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at compareTopic/update', e);
      return exits.badRequest({
        message: 'Error creating topic',
        e,
      });
    }
  },
};
