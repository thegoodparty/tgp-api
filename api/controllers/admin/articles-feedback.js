module.exports = {
  friendlyName: 'Articles Helpfulness Feedback',

  description: 'admin call for getting all articles feedback',

  inputs: {},

  exits: {
    success: {
      description: 'All Article Feedback',
    },

    badRequest: {
      description: 'Error getting feedback',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const articles = await HelpfulArticle.find();

      return exits.success({
        articles,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting users',
      });
    }
  },
};
