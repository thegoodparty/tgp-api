module.exports = {
  friendlyName: 'Articles Helpfulness Feedback',

  description: 'admin call for getting all topics feedback',

  inputs: {},

  exits: {
    success: {
      description: 'All Topic Feedback',
    },

    badRequest: {
      description: 'Error getting feedback',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const topics = await HelpfulTopic.find();

      return exits.success({
        topics,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting users',
      });
    }
  },
};
