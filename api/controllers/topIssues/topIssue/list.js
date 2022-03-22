module.exports = {
  friendlyName: 'list of the issue topics',

  inputs: {},

  exits: {
    success: {
      description: 'Found',
    },

    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const topIssues = await TopIssue.find()
        .populate('positions')
        .sort([{ id: 'ASC' }]);
      return exits.success({
        topIssues,
      });
    } catch (e) {
      console.log('error at issue topIssue/list', e);
      return exits.badRequest({
        message: 'Error topIssue/list',
        e,
      });
    }
  },
};
