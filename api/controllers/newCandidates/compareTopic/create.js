module.exports = {
  friendlyName: 'User supports a candidate',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
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
      const { name, description } = inputs;
      await CompareTopic.create({
        name,
        description,
      });

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('error at compareTopic/create', e);
      return exits.badRequest({
        message: 'Error creating topic',
        e,
      });
    }
  },
};
