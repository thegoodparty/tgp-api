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
      let positions = await Position.find()
        .populate('topIssue')
        .sort([{ name: 'ASC' }]);

      positions = positions.filter((pos) => !!pos.topIssue);

      console.log('pp', positions);

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
