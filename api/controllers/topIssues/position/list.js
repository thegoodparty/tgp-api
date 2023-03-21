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
      console.log('at positions');
      positions = await Position.find()
        .populate('topIssue')
        .sort([{ name: 'ASC' }]);

      return exits.success({
        positions,
      });
    } catch (e) {
      console.log('error at issue Position/list', e);
      return exits.badRequest({
        message: 'Error Position/list',
        e,
      });
    }
  },
};
