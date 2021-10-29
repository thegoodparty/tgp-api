module.exports = {
  friendlyName: 'edit issueTopic',

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
      await IssueTopic.updateOne({ id: topic.id }).set({
        topic: topic.topic,
        positions: topic.positions,
      });

      return exits.success({
        message: 'updated',
      });
    } catch (e) {
      console.log('error at issueTopic/update', e);
      return exits.badRequest({
        message: 'Error creating issue topic',
        e,
      });
    }
  },
};
