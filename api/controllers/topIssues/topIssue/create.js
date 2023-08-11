module.exports = {
  friendlyName: 'create a',

  inputs: {
    name: {
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
      const { name } = inputs;
      await TopIssue.create({
        name,
      });

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('error at issue topIssue/create', e);
      return exits.badRequest({
        message: 'Error creating issue topIssue',
        e,
      });
    }
  },
};
