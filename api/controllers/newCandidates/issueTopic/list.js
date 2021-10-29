module.exports = {
  friendlyName: 'list of the issue topics',

  inputs: {},

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
      const topics = await IssueTopic.find().sort([{ id: 'ASC' }]);
      return exits.success({
        topics,
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
