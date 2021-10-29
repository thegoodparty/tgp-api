module.exports = {
  friendlyName: 'create a issue topic',

  inputs: {
    topic: {
      type: 'string',
      required: true,
    },
    positions: {
      type: 'json',
    },
  },

  exits: {
    success: {
      description: 'Created',
    },

    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { topic, positions } = inputs;
      await IssueTopic.create({
        topic,
        positions,
      });

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('error at issue topic/create', e);
      return exits.badRequest({
        message: 'Error creating issue topic',
        e,
      });
    }
  },
};
