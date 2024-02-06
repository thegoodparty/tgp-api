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
        .sort([{ name: 'ASC' }])
        .populate('positions');

      for (let topIssue of topIssues) {
        if (topIssue.positions && Array.isArray(topIssue.positions)) {
          topIssue.positions.sort((a, b) => a.name.localeCompare(b.name));
        }
      }

      console.log('topIssues', topIssues);
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
