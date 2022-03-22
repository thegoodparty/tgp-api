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
      const topics = await Position.find().sort([{ id: 'ASC' }]);
      return exits.success({
        topics,
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
