module.exports = {
  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    topIssueId: {
      type: 'number',
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
      const { name, topIssueId } = inputs;
      await Position.create({
        name,
        topIssue: topIssueId,
      });

      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('error at issue position/create', e);
      return exits.badRequest({
        message: 'Error creating issue position',
        e,
      });
    }
  },
};
