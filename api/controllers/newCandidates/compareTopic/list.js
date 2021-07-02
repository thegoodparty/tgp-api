module.exports = {
  friendlyName: 'User supports a candidate',

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
      const topics = await CompareTopic.find();

      return exits.success({
        topics,
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
